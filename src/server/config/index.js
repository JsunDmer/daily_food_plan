import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

export default {
  port: process.env.SERVER_PORT || 3001,
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    apiBase: process.env.AI_API_BASE_URL || 'https://api.anthropic.com',
    model: process.env.AI_MODEL || 'claude-sonnet-4-6'
  },
  dataDir: path.resolve(__dirname, '../data')
}
