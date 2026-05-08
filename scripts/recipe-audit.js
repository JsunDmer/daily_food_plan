import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ROOT = process.cwd()
const RECIPES_FILE = path.join(PROJECT_ROOT, 'src/client/data/recipes.json')
const TAXONOMY_FILE = path.join(PROJECT_ROOT, 'config/recipe-taxonomy.json')
const CLASSIFICATION_OUTPUT_FILE = path.join(PROJECT_ROOT, 'config/recipe-classification-map.json')
const EXPANSION_OUTPUT_FILE = path.join(PROJECT_ROOT, 'config/recipe-expansion-plan.json')

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function buildSearchText(recipe) {
  const name = recipe.name || ''
  const description = recipe.description || ''
  const tags = (recipe.tags || []).join(' ')
  const ingredients = (recipe.ingredients || []).map(item => item.name).join(' ')
  return [name, description, tags, ingredients].join(' ').toLowerCase()
}

function hitKeyword(text, keywords = []) {
  return keywords.some(keyword => text.includes(String(keyword).toLowerCase()))
}

function inferExclusiveFacet(facetKey, text, facet, recipe, context) {
  for (const value of facet.values) {
    if (hitKeyword(text, value.keywords)) {
      return value.id
    }
  }

  if (facetKey === 'method') {
    if (recipe.category === 'dinner_soup') return 'boil'
    if (text.includes('拌')) return 'cold_mix'
    if (text.includes('蒸')) return 'steam'
    if (text.includes('煎')) return 'pan_fry'
    if (text.includes('炒')) return 'stir_fry'
    return 'boil'
  }

  if (facetKey === 'timeCost') {
    if (text.includes('快手') || text.includes('省时') || text.includes('凉拌')) return 'quick_15'
    if (context.method === 'boil' && (text.includes('汤') || text.includes('炖') || text.includes('煲'))) {
      return 'slow_30_plus'
    }
    if (context.method === 'steam') return 'normal_30'
    return 'normal_30'
  }

  if (facetKey === 'flavor') {
    if (text.includes('清淡') || text.includes('清甜') || text.includes('养生')) return 'light'
    if (text.includes('辣') || text.includes('麻')) return 'spicy'
    if (text.includes('酸甜') || text.includes('番茄') || text.includes('糖醋')) return 'sour_sweet'
    if (text.includes('奶') || text.includes('牛奶')) return 'milky'
    return 'savory'
  }

  return 'unknown'
}

function inferMultiFacet(facetKey, text, facet, recipe) {
  const hits = facet.values
    .filter(value => hitKeyword(text, value.keywords))
    .map(value => value.id)

  if (hits.length > 0) {
    return hits
  }

  if (facetKey === 'scene') {
    if (text.includes('快手')) return ['quick']
    if (text.includes('便当') || text.includes('备餐')) return ['meal_prep']
    return ['family']
  }

  if (facetKey === 'proteinType') {
    if (recipe.category === 'dinner_veg') return ['vegetable']
    if (recipe.category === 'breakfast_drink') return ['vegetable']
    return ['unclassified']
  }

  return ['unclassified']
}

function classifyRecipe(recipe, facets) {
  const text = buildSearchText(recipe)
  const result = {}
  const context = {}

  const orderedFacetKeys = ['method', 'flavor', 'scene', 'timeCost', 'proteinType']
  for (const facetKey of orderedFacetKeys) {
    const facet = facets[facetKey]
    if (!facet) continue

    if (facet.exclusive) {
      result[facetKey] = inferExclusiveFacet(facetKey, text, facet, recipe, context)
      context[facetKey] = result[facetKey]
    } else {
      result[facetKey] = inferMultiFacet(facetKey, text, facet, recipe)
      context[facetKey] = result[facetKey]
    }
  }

  return result
}

function countByCategory(recipes) {
  const map = {}
  for (const recipe of recipes) {
    map[recipe.category] = (map[recipe.category] || 0) + 1
  }
  return map
}

function countBySeason(recipes) {
  const map = { spring: 0, summer: 0, autumn: 0, winter: 0 }
  for (const recipe of recipes) {
    for (const season of recipe.season || []) {
      map[season] = (map[season] || 0) + 1
    }
  }
  return map
}

function buildCategorySeasonMatrix(recipes, categoryTargets) {
  const matrix = {}
  const seasons = ['spring', 'summer', 'autumn', 'winter']
  for (const category of Object.keys(categoryTargets)) {
    matrix[category] = { spring: 0, summer: 0, autumn: 0, winter: 0 }
  }

  for (const recipe of recipes) {
    if (!matrix[recipe.category]) {
      matrix[recipe.category] = { spring: 0, summer: 0, autumn: 0, winter: 0 }
    }
    for (const season of seasons) {
      if ((recipe.season || []).includes(season)) {
        matrix[recipe.category][season] += 1
      }
    }
  }

  return matrix
}

function countTopTags(recipes, limit = 15) {
  const map = {}
  for (const recipe of recipes) {
    for (const tag of recipe.tags || []) {
      map[tag] = (map[tag] || 0) + 1
    }
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }))
}

function buildFacetSummary(classificationRows, facets) {
  const facetCounts = {}
  const unclassified = {}

  for (const facetKey of Object.keys(facets)) {
    facetCounts[facetKey] = {}
    unclassified[facetKey] = []
  }

  for (const row of classificationRows) {
    for (const facetKey of Object.keys(facets)) {
      const value = row.classification[facetKey]
      const values = Array.isArray(value) ? value : [value]
      for (const item of values) {
        facetCounts[facetKey][item] = (facetCounts[facetKey][item] || 0) + 1
        if (item === 'unknown' || item === 'unclassified') {
          unclassified[facetKey].push(row.id)
        }
      }
    }
  }

  return { facetCounts, unclassified }
}

function buildGapSummary(categoryTargets, byCategory) {
  return Object.entries(categoryTargets).map(([category, target]) => {
    const currentCount = byCategory[category] || 0
    const minGap = Math.max(target.minCount - currentCount, 0)
    const targetGap = Math.max(target.targetCount - currentCount, 0)

    return {
      category,
      label: target.label,
      currentCount,
      minCount: target.minCount,
      targetCount: target.targetCount,
      minGap,
      targetGap
    }
  })
}

function expandWithPlaceholders(category, label, baseItems, neededCount) {
  const items = [...baseItems]
  let missingIndex = 1

  while (items.length < neededCount) {
    items.push({
      name: `待补充-${label}-${String(missingIndex).padStart(2, '0')}`,
      season: [],
      tags: ['待定'],
      method: 'boil',
      flavor: 'light',
      scene: ['family'],
      timeCost: 'normal_30',
      proteinType: ['unclassified'],
      notes: `请补充 ${label} 菜谱`
    })
    missingIndex += 1
  }

  return items.map(item => ({ ...item, category }))
}

function buildBatchPlans(gapSummary, expansionPool) {
  const batch1Items = []
  const batch2Items = []
  const poolCoverage = []

  for (const gap of gapSummary) {
    const pool = expansionPool[gap.category] || []
    const minNeed = gap.minGap
    const targetNeed = gap.targetGap
    const stage2Need = Math.max(targetNeed - minNeed, 0)

    const stage1FromPool = pool.slice(0, minNeed)
    const stage2FromPool = pool.slice(minNeed, minNeed + stage2Need)

    const stage1 = expandWithPlaceholders(gap.category, gap.label, stage1FromPool, minNeed)
    const stage2 = expandWithPlaceholders(gap.category, gap.label, stage2FromPool, stage2Need)

    batch1Items.push(...stage1)
    batch2Items.push(...stage2)

    poolCoverage.push({
      category: gap.category,
      label: gap.label,
      poolAvailable: pool.length,
      neededForMin: minNeed,
      neededForTarget: targetNeed,
      shortForTarget: Math.max(targetNeed - pool.length, 0)
    })
  }

  return {
    batch1: {
      id: 'batch-1-minimum',
      title: '先补齐最低库存',
      totalNewRecipes: batch1Items.length,
      items: batch1Items
    },
    batch2: {
      id: 'batch-2-target',
      title: '再冲刺目标库存',
      totalNewRecipes: batch2Items.length,
      items: batch2Items
    },
    poolCoverage
  }
}

function printConsoleSummary(summary) {
  console.log('=== 菜谱分类审计 ===')
  console.log(`总菜谱数: ${summary.totalRecipes}`)
  console.log('')
  console.log('分类库存:')
  for (const row of summary.gapSummary) {
    console.log(
      `- ${row.label}: 当前 ${row.currentCount}, 最低 ${row.minCount}, 目标 ${row.targetCount}, 最低缺口 ${row.minGap}, 目标缺口 ${row.targetGap}`
    )
  }
  console.log('')
  console.log('季节覆盖:')
  for (const [season, count] of Object.entries(summary.bySeason)) {
    console.log(`- ${season}: ${count}`)
  }
}

function main() {
  const recipesData = loadJson(RECIPES_FILE)
  const taxonomy = loadJson(TAXONOMY_FILE)
  const recipes = recipesData.recipes || []

  const classificationRows = recipes.map(recipe => ({
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    classification: classifyRecipe(recipe, taxonomy.facets)
  }))

  const byCategory = countByCategory(recipes)
  const bySeason = countBySeason(recipes)
  const gapSummary = buildGapSummary(taxonomy.categoryTargets, byCategory)
  const categorySeasonMatrix = buildCategorySeasonMatrix(recipes, taxonomy.categoryTargets)
  const topTags = countTopTags(recipes)
  const { facetCounts, unclassified } = buildFacetSummary(classificationRows, taxonomy.facets)
  const batches = buildBatchPlans(gapSummary, taxonomy.expansionPool || {})

  const classificationOutput = {
    generatedAt: new Date().toISOString(),
    source: {
      recipesFile: 'src/client/data/recipes.json',
      taxonomyFile: 'config/recipe-taxonomy.json'
    },
    totalRecipes: recipes.length,
    recipes: classificationRows,
    summary: {
      byCategory,
      bySeason,
      categorySeasonMatrix,
      facetCounts,
      unclassified,
      topTags
    }
  }

  const expansionOutput = {
    generatedAt: new Date().toISOString(),
    source: {
      recipesFile: 'src/client/data/recipes.json',
      taxonomyFile: 'config/recipe-taxonomy.json'
    },
    targets: taxonomy.categoryTargets,
    currentByCategory: byCategory,
    gapSummary,
    batches: [batches.batch1, batches.batch2],
    poolCoverage: batches.poolCoverage
  }

  writeJson(CLASSIFICATION_OUTPUT_FILE, classificationOutput)
  writeJson(EXPANSION_OUTPUT_FILE, expansionOutput)

  printConsoleSummary({
    totalRecipes: recipes.length,
    gapSummary,
    bySeason
  })
  console.log('')
  console.log(`分类结果已写入: ${path.relative(PROJECT_ROOT, CLASSIFICATION_OUTPUT_FILE)}`)
  console.log(`扩充清单已写入: ${path.relative(PROJECT_ROOT, EXPANSION_OUTPUT_FILE)}`)
}

main()
