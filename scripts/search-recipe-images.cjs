#!/usr/bin/env node
/**
 * 基于下厨房搜索页的菜谱图片检索脚本。
 *
 * 用法示例：
 *   node scripts/search-recipe-images.cjs --ids bs001,bs002
 *   node scripts/search-recipe-images.cjs --limit 10
 *   node scripts/search-recipe-images.cjs --all
 */

const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const https = require('node:https')

const RECIPES_FILE = path.join(__dirname, '../src/client/data/recipes.json')
const MAPPING_FILE = path.join(__dirname, 'recipe-search-mapping.json')
const OUTPUT_FILE = path.join(__dirname, 'image-search-results.json')
const FAILURE_FILE = path.join(__dirname, 'image-search-failures.json')
const SEARCH_BASE_URL = 'https://www.xiachufang.com/search/?keyword='
const IMAGE_PROCESS_SUFFIX = '?imageView2/1/w/800/h/800/interlace/1/q/85/format/jpg'
const DEFAULT_DELAY_MS = 1500

function loadJson(filePath, fallbackValue) {
  try {
    const text = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    if (error.code === 'ENOENT' && fallbackValue !== undefined) {
      return fallbackValue
    }
    throw error
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function requestText(url, options = {}, redirectCount = 0) {
  const timeoutMs = options.timeoutMs || 12000
  const maxRedirects = options.maxRedirects || 8
  const maxBodyBytes = options.maxBodyBytes || 2 * 1024 * 1024
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Referer: 'https://www.xiachufang.com/',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Connection: 'keep-alive'
  }

  return new Promise((resolve, reject) => {
    if (redirectCount > maxRedirects) {
      reject(new Error('Too many redirects'))
      return
    }

    const client = url.startsWith('https://') ? https : http
    const req = client.get(url, { headers }, (res) => {
      const statusCode = res.statusCode || 0
      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString()
        requestText(redirectUrl, options, redirectCount + 1).then(resolve).catch(reject)
        return
      }
      if (statusCode !== 200) {
        reject(new Error(`HTTP ${statusCode}`))
        return
      }

      let body = ''
      let totalBytes = 0
      res.setEncoding('utf8')
      res.on('data', (chunk) => {
        totalBytes += Buffer.byteLength(chunk)
        if (totalBytes > maxBodyBytes) {
          req.destroy(new Error(`Response too large: > ${maxBodyBytes} bytes`))
          return
        }
        body += chunk
      })
      res.on('end', () => resolve(body))
      res.on('error', reject)
    })

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timeout'))
    })
    req.on('error', reject)
  })
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeUrl(url) {
  if (!url) return null
  let next = decodeHtmlEntities(url.trim())
  if (!next) return null
  if (next.startsWith('//')) next = `https:${next}`
  if (next.startsWith('http://')) next = `https://${next.slice('http://'.length)}`
  if (!next.startsWith('https://')) return null
  return next
}

function isValidRecipeImageUrl(url) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    const filePath = parsed.pathname.toLowerCase()

    const isRecipeHost =
      /^i\d*\.chuimg\.com$/i.test(host) || /cdn\.xiachufang\.com/i.test(host)

    if (!isRecipeHost) return false
    if (!/\.(jpg|jpeg|png)$/i.test(filePath)) return false
    if (/\/pic\/2013\/ie-story\.(png|jpg|jpeg)$/i.test(filePath)) return false
    if (/favicon/i.test(filePath)) return false
    return true
  } catch {
    return false
  }
}

function extractImageCandidates(html) {
  const candidates = []
  const imgRegex = /<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/gim
  let match

  while ((match = imgRegex.exec(html)) !== null) {
    const normalized = normalizeUrl(match[1])
    if (!normalized) continue
    const cleaned = normalized.replace(/\?.*$/, '')
    if (!isValidRecipeImageUrl(cleaned)) continue
    candidates.push(cleaned)
  }

  return Array.from(new Set(candidates))
}

function extractRecipeEntries(html) {
  const entries = []
  const anchorRegex = /<a[^>]+href=["'](\/recipe\/\d+\/?)["'][^>]*>([\s\S]*?)<\/a>/gim
  let match

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1]
    const block = match[2]

    const imgMatch = /<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]*>/i.exec(block)
    if (!imgMatch?.[1]) continue

    const normalized = normalizeUrl(imgMatch[1])
    if (!normalized) continue
    const cleaned = normalized.replace(/\?.*$/, '')
    if (!isValidRecipeImageUrl(cleaned)) continue

    const altMatch = /alt=["']([^"']*)["']/i.exec(imgMatch[0])
    const title = decodeHtmlEntities((altMatch?.[1] || '').trim())

    entries.push({
      recipeUrl: `https://www.xiachufang.com${href}`,
      title,
      imageUrl: cleaned
    })
  }

  return entries
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^0-9a-z\u4e00-\u9fa5]/g, '')
}

function textOverlapRatio(source, target) {
  const targetChars = Array.from(new Set(normalizeText(target).split('')))
  if (!targetChars.length) return 0
  let hit = 0
  for (const ch of targetChars) {
    if (source.includes(ch)) hit += 1
  }
  return hit / targetChars.length
}

function pickBestRecipeEntry(entries, recipeName, keyword) {
  if (!entries.length) return null

  const recipeNameNorm = normalizeText(recipeName)
  const keywordNorm = normalizeText(keyword)
  let best = entries[0]
  let bestScore = -1

  for (const entry of entries) {
    const titleNorm = normalizeText(entry.title)
    let score = 0

    if (recipeNameNorm && titleNorm.includes(recipeNameNorm)) score += 12
    if (keywordNorm && titleNorm.includes(keywordNorm)) score += 8
    score += textOverlapRatio(titleNorm, recipeName) * 6

    if (/^https:\/\/i\d*\.chuimg\.com\//i.test(entry.imageUrl)) score += 1

    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }

  return best
}

function extractRecipeUrl(html) {
  const linkRegex = /href=["'](\/recipe\/\d+\/?)["']/gim
  const match = linkRegex.exec(html)
  if (!match?.[1]) return null
  return `https://www.xiachufang.com${match[1]}`
}

function optimizeImageUrl(url) {
  if (!url) return null
  return `${url.replace(/\?.*$/, '')}${IMAGE_PROCESS_SUFFIX}`
}

function readRecipes() {
  const payload = loadJson(RECIPES_FILE)
  return Array.isArray(payload.recipes) ? payload.recipes : []
}

function readMapping() {
  const payload = loadJson(MAPPING_FILE, {})
  return payload && typeof payload === 'object' ? payload : {}
}

function buildKeyword(recipe, mapping) {
  const mapped = mapping[recipe.id]
  if (typeof mapped === 'string' && mapped.trim()) return mapped.trim()
  if (mapped && typeof mapped === 'object' && typeof mapped.search === 'string' && mapped.search.trim()) {
    return mapped.search.trim()
  }
  return recipe.name
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const options = {
    ids: [],
    limit: null,
    all: false,
    delayMs: DEFAULT_DELAY_MS
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--ids' && args[i + 1]) {
      options.ids = args[i + 1]
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      i += 1
    } else if (arg === '--limit' && args[i + 1]) {
      const limit = Number(args[i + 1])
      if (Number.isFinite(limit) && limit > 0) options.limit = Math.floor(limit)
      i += 1
    } else if (arg === '--delay' && args[i + 1]) {
      const delay = Number(args[i + 1])
      if (Number.isFinite(delay) && delay >= 0) options.delayMs = Math.floor(delay)
      i += 1
    } else if (arg === '--all') {
      options.all = true
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return options
}

function printHelp() {
  console.log(`
菜谱图片检索（下厨房）

Usage:
  node scripts/search-recipe-images.cjs --ids bs001,bs002
  node scripts/search-recipe-images.cjs --limit 10
  node scripts/search-recipe-images.cjs --all

Options:
  --ids    仅检索指定菜谱 id（逗号分隔）
  --limit  仅检索前 N 条
  --all    检索全部菜谱
  --delay  每次请求间隔毫秒（默认 ${DEFAULT_DELAY_MS}）
`)
}

function pickRecipes(allRecipes, options) {
  if (options.ids.length > 0) {
    const idSet = new Set(options.ids)
    return allRecipes.filter((recipe) => idSet.has(recipe.id))
  }
  if (options.limit) {
    return allRecipes.slice(0, options.limit)
  }
  if (options.all) {
    return allRecipes
  }
  return allRecipes.slice(0, 10)
}

async function searchOneRecipe(recipe, keyword) {
  const searchUrl = `${SEARCH_BASE_URL}${encodeURIComponent(keyword)}`
  const html = await requestText(searchUrl)
  const recipeEntries = extractRecipeEntries(html)
  const bestEntry = pickBestRecipeEntry(recipeEntries, recipe.name, keyword)
  const imageCandidates = recipeEntries.length
    ? recipeEntries.map((item) => item.imageUrl)
    : extractImageCandidates(html)
  const rawImageUrl = bestEntry?.imageUrl || imageCandidates[0] || null
  const imageUrl = optimizeImageUrl(rawImageUrl)

  return {
    id: recipe.id,
    name: recipe.name,
    keyword,
    searchUrl,
    recipeUrl: bestEntry?.recipeUrl || extractRecipeUrl(html),
    imageTitle: bestEntry?.title || '',
    imageUrl,
    imageCandidates: imageCandidates.slice(0, 5),
    matched: Boolean(imageUrl)
  }
}

async function run() {
  const options = parseArgs(process.argv)
  const recipes = readRecipes()
  const mapping = readMapping()
  const targetRecipes = pickRecipes(recipes, options)

  if (targetRecipes.length === 0) {
    console.log('未找到可检索的菜谱。')
    return
  }

  const results = {}
  const failures = {}

  console.log(`开始检索：${targetRecipes.length} 道菜谱`)
  for (let i = 0; i < targetRecipes.length; i += 1) {
    const recipe = targetRecipes[i]
    const keyword = buildKeyword(recipe, mapping)
    const progress = `[${i + 1}/${targetRecipes.length}]`

    try {
      const item = await searchOneRecipe(recipe, keyword)
      results[recipe.id] = item
      if (!item.matched) {
        failures[recipe.id] = {
          id: recipe.id,
          name: recipe.name,
          keyword,
          reason: 'NO_IMAGE_CANDIDATE'
        }
      }
      console.log(`${progress} ${recipe.id} ${recipe.name} -> ${item.matched ? 'MATCHED' : 'NO_MATCH'}`)
    } catch (error) {
      failures[recipe.id] = {
        id: recipe.id,
        name: recipe.name,
        keyword,
        reason: error.message
      }
      console.log(`${progress} ${recipe.id} ${recipe.name} -> ERROR (${error.message})`)
    }

    if (i < targetRecipes.length - 1) {
      const jitter = Math.floor(Math.random() * 300)
      await sleep(options.delayMs + jitter)
    }
  }

  writeJson(OUTPUT_FILE, results)
  writeJson(FAILURE_FILE, failures)

  const matchedCount = Object.values(results).filter((item) => item.matched).length
  console.log('\n检索完成')
  console.log(`输出文件: ${OUTPUT_FILE}`)
  console.log(`失败文件: ${FAILURE_FILE}`)
  console.log(`命中数量: ${matchedCount}/${targetRecipes.length}`)
}

if (require.main === module) {
  run().catch((error) => {
    console.error('脚本执行失败：', error)
    process.exit(1)
  })
}

module.exports = {
  extractImageCandidates,
  extractRecipeUrl,
  optimizeImageUrl,
  parseArgs
}
