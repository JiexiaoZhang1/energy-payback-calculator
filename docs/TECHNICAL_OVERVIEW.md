# Technical Overview / 技术说明

This document explains the implementation details behind the Energy Payback Calculator.

这份文档说明家庭用电回本计算器的实现结构。

## Stack / 技术栈

Frontend:

- React
- TypeScript
- Vite
- Framer Motion
- Lucide React
- Canvas API for share image generation
- LocalStorage for local persistence

Backend:

- Node.js
- Express
- CORS middleware
- File-based scenario storage under `data/`

Testing:

- Vitest
- Testing Library
- jsdom

## Main Files / 主要文件

| File | Purpose |
|---|---|
| `src/App.tsx` | Main React app, screen flow, input/result screens |
| `src/styles.css` | Mobile-first UI styling |
| `src/lib/calculations.ts` | Frontend calculation model |
| `src/lib/tariffEditor.ts` | Tariff editing helpers |
| `src/lib/i18n.ts` | Multilingual text |
| `src/lib/defaults.ts` | Default state, language and currency options |
| `src/lib/storage.ts` | LocalStorage load/save logic |
| `src/lib/api.ts` | API client for calculation and scenario loading |
| `src/lib/shareImage.ts` | Canvas share image generation |
| `src/lib/types.ts` | Shared frontend TypeScript types |
| `server/index.js` | Express API and static frontend serving |
| `server/calculations.js` | Backend calculation model |

## Data Model / 数据模型

The central state shape is `CalculatorState`.

It contains:

- `language`
- `currency`
- `tariffBlocks`
- `assets`
- `totalCost`
- `advanced`

The central output shape is `CalculationResult`.

It contains:

- `hourlyPrices`
- `annualSavings`
- `paybackYears`
- `investmentCost`
- `contributions`
- `cheapHours`
- `expensiveHours`
- `averageRate`

中文说明：

核心输入是 `CalculatorState`，包括语言、货币、电价时段、设备、总成本和高级参数。核心输出是 `CalculationResult`，包括 24 小时电价、年节省、回本年限、投资成本、各设备贡献、便宜时段、昂贵时段和平均电价。

## Tariff Editing / 电价编辑逻辑

Tariff blocks are user-facing ranges such as:

```ts
{ startHour: 0, endHour: 6, pricePerKwh: -0.2 }
```

The editor utilities convert user edits into a clean 24-hour model.

Important helpers:

- `normalizeHour`
- `expandTariffBlocks`
- `blocksToHourlyPrices`
- `hourlyPricesToBlocks`
- `normalizeTariffBlocksForEditing`
- `coverTariffRange`
- `updateTariffBlockRange`
- `deleteTariffBlock`

Key behavior:

1. Hours are clamped to valid values.
2. Each block covers at least one hour.
3. Missing hours fall back to a default price.
4. Overlapping ranges are resolved through hourly expansion.
5. Adjacent hours with the same price are merged into one block.
6. The final editable tariff always covers the 24-hour day.

中文说明：

电价编辑器先把时段展开成 24 个小时价格，再根据用户修改重新合并成连续时段。这样可以处理重叠、删除、新增、缺失等情况，并保证最终电价表覆盖 00:00 到 24:00。

## Calculation Model / 计算模型

The model estimates savings by comparing cheap-use rates with expensive avoided rates.

### Battery

For a battery:

1. Daily discharge is based on usable capacity and cycles per day.
2. Charging energy is adjusted by battery efficiency.
3. Low-rate charging cost is estimated from the cheapest window.
4. Avoided grid purchase is estimated from the expensive window.
5. Annual savings are:

```text
dailyDischargeKwh * max(0, avoidedRate - lowRate / efficiency) * 365
```

中文：

电池按可用容量和每天循环次数估算放电量，再考虑充电效率。低价时段充电，高价时段减少从电网买电，节省来自二者价差。

### Heat Pump / Hot Water

For heat:

1. Heat demand is converted to electric kWh by COP.
2. The app compares cheap usage with expensive avoided usage.
3. Savings are annualized across 365 days.

中文：

热泵热水先用 COP 把热需求折算成电量，再比较低价运行和高价运行之间的差额。

### EV Charging

For EV charging:

1. Weekly charging energy is divided into an average daily charge amount.
2. Savings are calculated across 52 weeks.

中文：

电动车按每周充电量估算，把可安排充电挪到低价时段，再按 52 周折算年节省。

### Timed Appliances

For timed appliances:

1. Daily shiftable kWh is moved into cheaper periods.
2. Savings are annualized across 365 days.

中文：

可预约家电按每天可移动电量估算，把运行时间挪到低价时段后计算年节省。

## Backend API / 后端 API

### `GET /api/health`

Returns:

```json
{ "ok": true, "service": "energy-payback-api" }
```

### `POST /api/calculate`

Request:

```json
{ "state": { "...": "CalculatorState" } }
```

Response:

```json
{ "result": { "...": "CalculationResult" }, "source": "server" }
```

### `POST /api/scenarios`

Request:

```json
{ "state": { "...": "CalculatorState" }, "result": { "...": "CalculationResult" } }
```

Response:

```json
{ "scenario": { "id": "..." }, "id": "..." }
```

### `GET /api/scenarios/:id`

Loads a saved scenario from `data/:id.json`.

中文说明：

后端 API 很小，主要用于健康检查、计算、保存方案和读取方案。保存的方案是 JSON 文件，放在 `data/` 下。

## Frontend Fallback / 前端兜底

When the user clicks calculate:

1. The frontend calls `calculateOnServer(state)`.
2. If the API call succeeds, the result is marked as backend-calculated.
3. If the API call fails, the frontend uses `calculateSavings(state)` locally.
4. The result screen still works.

This behavior is useful for static hosting, local development without the backend, and demos where the API server is temporarily unavailable.

中文说明：

点击计算时，前端会先请求后端。如果后端不可用，就直接使用前端本地计算函数。这样即使部署到静态页面，核心计算也不会失效。

## Share Flow / 分享流程

Share behavior:

1. Save the current state and result through `/api/scenarios`.
2. Create a URL with `?scenario=<id>`.
3. Copy the link when the clipboard API is available.
4. Generate a PNG share image with Canvas.

Fallback behavior:

If scenario saving fails, the app still tries to generate the share image.

中文说明：

分享时会先保存方案，生成带 `scenario` 参数的链接，再用 Canvas 生成图片。如果后端保存失败，仍会尝试生成分享图片。

## Testing Coverage / 测试覆盖

The test suite covers:

- Tariff expansion into 24 hourly prices.
- Negative price handling.
- Invalid hour normalization.
- Cheap and expensive window selection.
- Savings calculation for all device categories.
- Flat tariff producing no payback.
- Tariff editor add/update/delete behavior.
- LocalStorage state persistence.
- Formatting helpers.
- Language and currency switching.
- Main input-to-result app flow.
- Share image generation behavior.
- Backend calculation parity checks.

中文说明：

测试覆盖了电价展开、负电价、时段规范化、各设备节省计算、无价差不回本、电价编辑、本地存储、格式化、语言货币切换、主流程、分享图片和后端计算。

## Deployment Notes / 部署说明

### GitHub Pages

GitHub Pages can be used as optional static frontend hosting. Build with:

```bash
VITE_BASE_PATH=/energy-payback-calculator/ npm run build
```

This makes asset paths work under:

```text
https://jiexiaozhang1.github.io/energy-payback-calculator/
```

Backend features do not run on GitHub Pages. To automate GitHub Pages deployment through GitHub Actions, the GitHub token used for pushing workflow files needs the `workflow` scope.

### Full Backend Deployment

To deploy the full app, use a Node-capable host and run:

```bash
npm ci
npm run build
npm run start
```

Set the `PORT` environment variable if the host requires it.

中文说明：

GitHub Pages 适合部署静态前端展示。如果要通过 GitHub Actions 自动部署 Pages，推送 workflow 文件的 GitHub token 需要 `workflow` 权限。如果要完整支持后端 API 和方案保存，需要部署到支持 Node.js 的平台，并运行 Express 服务。

## Security Notes / 安全说明

The project does not require API keys.

Ignored by Git:

- `.env`
- `.env.*`
- `data/*.json`
- `node_modules/`
- `dist/`
- `.playwright-cli/`
- log files
- coverage files

Before publishing, the repository was checked for common secret keywords such as API key, token, password, bearer token, GitHub token, OpenAI key, and private key markers.

中文说明：

项目不需要 API 密钥。发布前已检查常见密钥关键词，运行时生成的数据和环境文件默认不会提交。
