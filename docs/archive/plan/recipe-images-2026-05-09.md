# 菜谱图片计划归档（2026-05-09）

## 归档信息
- 原计划文件：`docs/plan/recipe-images.md`
- 执行分支：`feature/recipe-images-phase1`
- 归档原因：阶段 1 开发已落地，计划转入历史归档

## 本轮目标完成情况
- [x] 将图片检索脚本切换为下厨房中文搜索（无 API Key）
- [x] 新增统一图片组件并接入 `RecipesView.vue`、`DishCard.vue`
- [x] 新增本地占位图资源
- [x] 完成构建验证（`npm run build`）
- [x] 完成计划归档

## 实际代码交付
- 新增脚本：`scripts/search-recipe-images.cjs`
  - 支持 `--ids` / `--limit` / `--all` / `--delay`
  - 输出 `image-search-results.json` 与 `image-search-failures.json`
  - 下厨房检索命中后自动标准化为 800x800 URL 参数
- 新增脚本：`scripts/download-recipe-images.cjs`
  - 支持 `--ids` / `--limit` / `--all` / `--force`
  - 下载到 `src/client/public/images/recipes/{id}.jpg`
  - 输出失败清单 `image-download-failures.json`
- 新增组件：`src/client/components/RecipeImage.vue`
  - 懒加载、骨架屏、错误回退、暖色覆盖层
- 页面接入：
  - `src/client/views/RecipesView.vue`
  - `src/client/components/DishCard.vue`
  - 图片来源策略：`recipe.image` -> `/images/recipes/{id}.jpg`；若本地图片缺失或加载失败，由 `RecipeImage` 自动回退占位图
- 新增资源：`src/client/public/images/recipes/placeholder.svg`
- 新增脚本命令：
  - `npm run images:search`
  - `npm run images:download`
- 生成物忽略：
  - `scripts/image-search-results.json`
  - `scripts/image-search-failures.json`
  - `scripts/image-download-failures.json`

## 验证记录
- 脚本帮助命令：
  - `node scripts/search-recipe-images.cjs --help`
  - `node scripts/download-recipe-images.cjs --help`
- 脚本冒烟：
  - `node scripts/search-recipe-images.cjs --ids bs001 --delay 0`（命中）
  - `node scripts/download-recipe-images.cjs --ids bs001 --delay 0`（下载成功，随后清理测试图片）
- 工程构建：
  - `npm run build` 通过
- IDE 诊断：
  - `RecipesView.vue` / `DishCard.vue` / `RecipeImage.vue` 无新增 lint 错误

## 后续阶段建议
- 批量跑 `images:search` + `images:download`，按分类分批执行并人工抽检图片质量。
- 若后续确认版权/来源规范，可再进入“全量 182 道图片落盘 + 数据字段回填”阶段。
