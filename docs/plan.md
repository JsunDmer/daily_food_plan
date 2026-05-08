# 一周饮食计划生成工具 - 实现方案

## Context

用户需要一个 Web 应用，自动生成一周的饮食计划。每天规定早餐（主食+副食+饮品）和晚餐（1荤2素1汤），包含菜品、食材清单及叮咚买菜搜索链接。菜谱库以中式家常菜为主，支持用户喜好管理（喜欢/不喜欢/自定义添加），推荐算法基于多维度智能匹配。

## 需求汇总

| 维度 | 决策 |
|------|------|
| 产品形态 | Web 应用 |
| 技术栈 | Node.js 全栈（Vue 3 + Express） |
| 菜谱数据 | AI 生成种子数据，用户可自定义添加 |
| 链接方式 | 叮咚买菜搜索链接（`https://dingdong.macaoyun.com/search?keyword=食材名`） |
| 推荐逻辑 | 多维度智能推荐（喜好权重+去重+营养均衡+季节时令+费用） |
| 数据存储 | JSON 文件 |
| 早餐规格 | 3 样（主食 + 副食 + 饮品） |
| 晚餐规格 | 4 菜（1 荤 + 2 素 + 1 汤） |
| 菜系偏好 | 中餐家常菜 |

## 核心功能

1. **生成一周计划**：按规则自动生成 7 天早晚餐，支持重新生成单日
2. **菜谱浏览**：在线查看所有菜谱，按分类筛选
3. **喜好管理**：喜欢（提高权重）、不喜欢（不推荐）、自定义添加菜谱
4. **食材采购**：每项食材带叮咚买菜搜索链接，一键跳转

## 项目结构

```
daily_food_plan/
├── src/
│   ├── client/                  # Vue 3 前端
│   │   ├── index.html
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router/
│   │   │   └── index.js
│   │   ├── components/
│   │   │   ├── WeeklyPlan.vue       # 一周计划总览
│   │   │   ├── DayPlan.vue          # 单日计划卡片
│   │   │   ├── MealSection.vue      # 早餐/晚餐区块
│   │   │   ├── DishCard.vue         # 菜品卡片（含食材+叮咚链接）
│   │   │   ├── IngredientList.vue   # 食材清单（叮咚链接）
│   │   │   └── GenerateBar.vue      # 生成/重新生成操作栏
│   │   ├── views/
│   │   │   ├── PlanView.vue         # 计划页面
│   │   │   └── RecipesView.vue      # 菜谱浏览页面
│   │   ├── api/
│   │   │   └── index.js             # API 调用封装
│   │   └── styles/
│   │       └── main.css
│   └── server/                  # Express 后端
│       ├── index.js                 # 入口，启动服务
│       ├── routes/
│       │   ├── plan.js              # 计划相关路由
│       │   └── recipes.js           # 菜谱相关路由
│       ├── services/
│       │   ├── planGenerator.js     # 计划生成（多维度推荐算法）
│       │   ├── recipeManager.js     # 菜谱管理（CRUD + 喜好）
│       │   └── aiService.js         # AI 服务（生成种子数据 + 搭配优化）
│       ├── data/
│       │   ├── recipes.json         # 菜谱库
│       │   ├── userPrefs.json       # 用户喜好（喜欢/不喜欢/权重）
│       │   └── plans.json           # 已生成的计划
│       └── config/
│           └── index.js             # 配置管理
├── scripts/
│   └── seedRecipes.js              # AI 生成种子菜谱的脚本
├── docs/                            # 项目文档
├── package.json
├── vite.config.js
└── .env.example
```

## 数据模型

### 菜谱 (recipes.json)

```json
{
  "recipes": [
    {
      "id": "r001",
      "name": "红烧肉",
      "category": "dinner_meat",
      "tags": ["硬菜", "猪肉"],
      "season": ["spring", "autumn", "winter"],
      "ingredients": [
        { "name": "五花肉", "amount": "500g" },
        { "name": "生抽", "amount": "2勺" },
        { "name": "老抽", "amount": "1勺" },
        { "name": "冰糖", "amount": "30g" },
        { "name": "八角", "amount": "2个" },
        { "name": "葱姜", "amount": "适量" }
      ],
      "nutrition": { "calories": 550, "protein": "high", "fat": "high" },
      "cost": "medium",
      "description": "经典家常红烧肉，肥而不腻"
    }
  ]
}
```

### 用户喜好 (userPrefs.json)

```json
{
  "favorites": ["r001", "r003"],
  "dislikes": ["r015"],
  "customRecipes": ["c001"],
  "weights": {
    "r001": 2.0,
    "r003": 1.5,
    "r015": 0
  }
}
```

### 分类定义

| 分类 key | 名称 | 说明 |
|----------|------|------|
| breakfast_staple | 早餐-主食 | 粥、面、饼等 |
| breakfast_side | 早餐-副食 | 蛋、小菜等 |
| breakfast_drink | 早餐饮品 | 牛奶、豆浆等 |
| dinner_meat | 晚餐-荤菜 | 肉类主菜 |
| dinner_veg | 晚餐-素菜 | 蔬菜类 |
| dinner_soup | 晚餐-汤 | 汤类 |

## 多维度推荐算法

```
最终得分 = 基础分 × 喜好权重 × 季节系数 × 营养均衡系数 × 去重惩罚

- 基础分：随机种子，保证每次生成不雷同
- 喜好权重：喜欢=2.0，默认=1.0，不喜欢=0（直接排除）
- 季节系数：当季菜=1.2，四季菜=1.0，反季菜=0.6
- 营养均衡：已选菜品中同类营养偏多时降低该类系数
- 去重惩罚：本周已选过的菜乘以 0.3 系数
```

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/plan/generate | 生成一周计划 |
| GET  | /api/plan/current | 获取当前计划 |
| POST | /api/plan/regenerate-day | 重新生成某一天的计划 |
| GET  | /api/recipes | 获取菜谱列表（支持分类筛选） |
| GET  | /api/recipes/:id | 获取单个菜谱详情 |
| POST | /api/recipes | 添加自定义菜谱 |
| PUT  | /api/recipes/:id | 修改菜谱 |
| POST | /api/recipes/:id/favorite | 标记喜欢 |
| POST | /api/recipes/:id/dislike | 标记不喜欢 |
| DELETE | /api/recipes/:id/favorite | 取消喜欢 |
| DELETE | /api/recipes/:id/dislike | 取消不喜欢 |

## 前端页面

### 1. 计划页面 (PlanView)
- 顶部：生成一周计划按钮
- 7 天卡片网格，每天含早餐区块 + 晚餐区块
- 每道菜显示：菜名、食材清单（每项带叮咚链接图标）
- 每天有「重新生成」按钮
- 底部：汇总采购清单（去重后的食材列表）

### 2. 菜谱浏览页面 (RecipesView)
- 分类 Tab 筛选
- 菜谱卡片列表：菜名、分类、食材概要
- 喜欢/不喜欢操作按钮
- 添加自定义菜谱按钮 + 表单弹窗

## 实现步骤

### Step 1: 项目初始化
- 初始化 package.json，安装依赖
- 配置 Vite + Express 开发环境
- 创建 .env.example

### Step 2: 菜谱数据建设
- 用 AI 生成种子菜谱脚本 (scripts/seedRecipes.js)
- 生成 6 个分类各 10-15 道菜的 recipes.json
- 包含食材、季节、营养、费用等维度数据

### Step 3: 后端核心
- recipeManager.js：菜谱 CRUD + 喜好管理
- planGenerator.js：多维度推荐算法
- aiService.js：AI 调用封装（种子生成 + 搭配优化）
- Express 路由：11 个 API 端点

### Step 4: 前端 - 计划页面
- WeeklyPlan / DayPlan / MealSection / DishCard / IngredientList / GenerateBar
- 计划生成与展示
- 重新生成单日
- 采购清单汇总

### Step 5: 前端 - 菜谱浏览页面
- RecipesView：分类浏览 + 喜欢/不喜欢
- 添加自定义菜谱表单
- Vue Router 导航

### Step 6: 集成与测试
- 前后端联调
- 推荐算法验证
- 叮咚链接跳转测试
- 响应式布局适配

## 验证方案

1. `npm run dev` 启动前后端
2. 计划页面：生成一周计划，7 天数据完整
3. 每天早餐 3 样，晚餐 4 菜，分类正确
4. 食材叮咚链接可跳转
5. 重新生成单日功能正常
6. 菜谱浏览：分类筛选、喜欢/不喜欢操作
7. 添加自定义菜谱后能被推荐到
8. 喜欢的菜更常出现，不喜欢的菜不出现
9. 手机端布局正常
