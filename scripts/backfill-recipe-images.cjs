#!/usr/bin/env node
/**
 * 按 public/images/recipes/*.jpg 批量回填 recipes.json 的 image 字段。
 *
 * 用法：
 *   node scripts/backfill-recipe-images.cjs
 */

const fs = require('node:fs')
const path = require('node:path')

const RECIPES_FILE = path.join(__dirname, '../src/client/data/recipes.json')
const IMAGES_DIR = path.join(__dirname, '../public/images/recipes')

function run() {
  if (!fs.existsSync(RECIPES_FILE)) {
    throw new Error(`recipes 文件不存在: ${RECIPES_FILE}`)
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    throw new Error(`图片目录不存在: ${IMAGES_DIR}`)
  }

  const raw = fs.readFileSync(RECIPES_FILE, 'utf8')
  const imageFiles = new Set(
    fs
      .readdirSync(IMAGES_DIR)
      .filter((name) => name.toLowerCase().endsWith('.jpg'))
  )

  const replaced = raw.replace(
    /"id":\s*"([^"]+)",(?!\s*"image":)/g,
    (match, id) => {
      const imageName = `${id}.jpg`
      if (!imageFiles.has(imageName)) {
        return match
      }
      return `"id": "${id}", "image": "/images/recipes/${id}.jpg",`
    }
  )

  fs.writeFileSync(RECIPES_FILE, replaced)

  const payload = JSON.parse(replaced)
  const recipes = Array.isArray(payload.recipes) ? payload.recipes : []
  const withImage = recipes.filter((recipe) => typeof recipe.image === 'string' && recipe.image).length

  console.log('回填完成')
  console.log(`菜谱总数: ${recipes.length}`)
  console.log(`已回填 image: ${withImage}`)
  console.log(`覆盖率: ${recipes.length ? ((withImage / recipes.length) * 100).toFixed(2) : '0.00'}%`)
}

if (require.main === module) {
  try {
    run()
  } catch (error) {
    console.error('回填失败:', error.message)
    process.exit(1)
  }
}

