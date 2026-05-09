#!/usr/bin/env node
/**
 * 根据 image-search-results.json 下载菜谱图片到本地。
 *
 * 用法示例：
 *   node scripts/download-recipe-images.cjs --ids bs001,bs002
 *   node scripts/download-recipe-images.cjs --limit 20
 *   node scripts/download-recipe-images.cjs --all
 */

const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const https = require('node:https')

const SEARCH_RESULTS_FILE = path.join(__dirname, 'image-search-results.json')
const DOWNLOAD_FAILURES_FILE = path.join(__dirname, 'image-download-failures.json')
const OUTPUT_DIR = path.join(__dirname, '../public/images/recipes')
const DEFAULT_DELAY_MS = 800

function loadJson(filePath, fallbackValue) {
  try {
    const text = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    if (error.code === 'ENOENT' && fallbackValue !== undefined) return fallbackValue
    throw error
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const options = {
    ids: [],
    limit: null,
    all: false,
    delayMs: DEFAULT_DELAY_MS,
    force: false
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
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return options
}

function printHelp() {
  console.log(`
菜谱图片下载

Usage:
  node scripts/download-recipe-images.cjs --ids bs001,bs002
  node scripts/download-recipe-images.cjs --limit 20
  node scripts/download-recipe-images.cjs --all

Options:
  --ids    仅下载指定 id（逗号分隔）
  --limit  仅下载前 N 条
  --all    下载全部检索结果
  --delay  请求间隔毫秒（默认 ${DEFAULT_DELAY_MS}）
  --force  覆盖已存在文件
`)
}

function pickItems(results, options) {
  const list = Object.values(results).filter((item) => item && item.id)
  if (options.ids.length > 0) {
    const idSet = new Set(options.ids)
    return list.filter((item) => idSet.has(item.id))
  }
  if (options.limit) return list.slice(0, options.limit)
  if (options.all) return list
  return list.slice(0, 10)
}

function downloadFile(url, filePath, redirectCount = 0, maxRedirects = 8) {
  return new Promise((resolve, reject) => {
    if (redirectCount > maxRedirects) {
      reject(new Error('Too many redirects'))
      return
    }

    const client = url.startsWith('https://') ? https : http
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.xiachufang.com/',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
    }

    const tempPath = `${filePath}.tmp`
    const fileStream = fs.createWriteStream(tempPath)
    let settled = false

    const cleanupTemp = () => {
      if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true })
    }

    const fail = (error) => {
      if (settled) return
      settled = true
      fileStream.destroy()
      cleanupTemp()
      reject(error)
    }

    const req = client.get(url, { headers }, (res) => {
      const statusCode = res.statusCode || 0
      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        settled = true
        fileStream.destroy()
        cleanupTemp()
        const redirectUrl = new URL(res.headers.location, url).toString()
        downloadFile(redirectUrl, filePath, redirectCount + 1, maxRedirects).then(resolve).catch(reject)
        return
      }
      if (statusCode !== 200) {
        fail(new Error(`HTTP ${statusCode}`))
        return
      }

      const contentType = String(res.headers['content-type'] || '').toLowerCase()
      if (!contentType.startsWith('image/')) {
        fail(new Error(`Unexpected content-type: ${contentType || 'unknown'}`))
        return
      }

      res.pipe(fileStream)
      fileStream.on('finish', () => {
        if (settled) return
        settled = true
        fileStream.close(() => {
          fs.renameSync(tempPath, filePath)
          resolve()
        })
      })
      res.on('error', fail)
    })

    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timeout'))
    })
    req.on('error', fail)
    fileStream.on('error', fail)
  })
}

async function run() {
  const options = parseArgs(process.argv)
  const results = loadJson(SEARCH_RESULTS_FILE, {})
  const items = pickItems(results, options)
  ensureDir(OUTPUT_DIR)

  if (items.length === 0) {
    console.log('没有可下载的数据，请先执行搜索脚本。')
    return
  }

  const failures = {}
  let downloaded = 0
  let skipped = 0

  console.log(`开始下载：${items.length} 张图片`)
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i]
    const progress = `[${i + 1}/${items.length}]`
    const targetPath = path.join(OUTPUT_DIR, `${item.id}.jpg`)

    if (!item.imageUrl) {
      failures[item.id] = {
        id: item.id,
        name: item.name,
        reason: 'EMPTY_IMAGE_URL'
      }
      console.log(`${progress} ${item.id} ${item.name} -> SKIP (no imageUrl)`)
      continue
    }

    if (fs.existsSync(targetPath) && !options.force) {
      skipped += 1
      console.log(`${progress} ${item.id} ${item.name} -> SKIP (exists)`)
      continue
    }

    try {
      await downloadFile(item.imageUrl, targetPath)
      downloaded += 1
      console.log(`${progress} ${item.id} ${item.name} -> DOWNLOADED`)
    } catch (error) {
      failures[item.id] = {
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        reason: error.message
      }
      console.log(`${progress} ${item.id} ${item.name} -> ERROR (${error.message})`)
    }

    if (i < items.length - 1) {
      await sleep(options.delayMs)
    }
  }

  writeJson(DOWNLOAD_FAILURES_FILE, failures)
  console.log('\n下载完成')
  console.log(`成功: ${downloaded}`)
  console.log(`跳过: ${skipped}`)
  console.log(`失败: ${Object.keys(failures).length}`)
  console.log(`失败详情: ${DOWNLOAD_FAILURES_FILE}`)
}

if (require.main === module) {
  run().catch((error) => {
    console.error('下载脚本执行失败：', error)
    process.exit(1)
  })
}

module.exports = {
  parseArgs
}
