import express from 'express'
import cors from 'cors'
import config from './config/index.js'
import planRoutes from './routes/plan.js'
import recipeRoutes from './routes/recipes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/plan', planRoutes)
app.use('/api/recipes', recipeRoutes)

app.listen(config.port, () => {
  console.log(`服务已启动: http://localhost:${config.port}`)
})
