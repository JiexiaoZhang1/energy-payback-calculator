# Energy Payback Calculator / 家庭用电回本计算器

![Input screen in Chinese](docs/assets/screenshot-input-zh.png)

## English Overview

Energy Payback Calculator is a mobile-first web demo for estimating household energy savings and equipment payback under time-of-use electricity pricing. It is designed for situations where electricity prices change across the day, including negative-price overnight windows, lower daytime rates, and expensive evening peak rates.

The user enters a daily tariff schedule, chooses flexible household energy devices, and provides equipment cost and efficiency assumptions. The app then estimates how much money each device category may save per year and how long the investment may take to pay back.

The basic idea is simple: use or charge electricity when it is cheap, avoid buying from the grid when it is expensive, and turn that price spread into a rough annual savings estimate.

## 中文概览

这个网页应用是一个家庭用电省钱回本计算器。它适合用来演示“分时电价”和“负电价”场景下，家庭通过储能电池、热泵热水、电动车充电、可预约家电等设备，把用电安排到更便宜的时间段后，大概能省多少钱、几年能回本。

用户先填一天里不同时间段的电价，比如凌晨负电价、白天低价、傍晚高价；再选择家里有哪些能灵活安排用电的设备；最后填设备总成本和效率参数。系统会根据“便宜时段尽量充电或用电，贵时段尽量少从电网买电”的思路，估算每类设备每年大概能省多少钱，以及总投入大概几年能回本。

这不是一个只展示静态页面的 mockup。它包含真实输入、可编辑电价、前端本地计算、后端 API 计算、方案保存、分享链接恢复、分享图片生成、多语言和多货币展示。

## Demo Options / 展示方式

Static online demo:

https://jiexiaozhang1.github.io/energy-payback-calculator/

Local full-stack demo:

```bash
npm install
npm run build
npm run start
```

Open:

```text
http://localhost:8787
```

Optional static hosting:

GitHub Pages or another static host can serve the frontend after building with a subpath base:

```bash
VITE_BASE_PATH=/energy-payback-calculator/ npm run build
```

Note: GitHub Pages is static hosting, so the Express backend is not available there. The calculator still works because the frontend falls back to the local calculation logic when the API is unavailable. Backend-only features such as saved scenario links require running the Express server locally or deploying the backend separately.

中文说明：

最完整的展示方式是本地运行 Express 后端。如果部署到 GitHub Pages 这类静态托管，页面会自动退回到前端本地计算；核心计算和结果展示仍然可以用。保存分享方案这类依赖后端的功能，需要本地运行后端或单独部署后端服务。

## Screenshots / 截图

### Chinese input flow / 中文输入页

![Chinese input screen](docs/assets/screenshot-input-zh.png)

### Tariff editor drawer / 电价编辑抽屉

![Tariff editor drawer](docs/assets/screenshot-tariff-editor-zh.png)

### English result screen / 英文结果页

![English result screen](docs/assets/screenshot-result-en.png)

### Desktop framing / 桌面宽屏展示

![Desktop screenshot](docs/assets/screenshot-desktop-en.png)

## What The Demo Does / 这个 Demo 做什么

The app helps answer a practical question:

If a household can move some electricity use into cheaper hours, how much money could it save, and how long might the equipment take to pay back?

这个应用回答的是一个很具体的问题：

如果一个家庭能把部分用电挪到更便宜的时间段，一年大概能省多少钱？这些设备投入大概多久能回本？

The demo focuses on four flexible energy categories:

1. Home battery
2. Heat pump or hot water load
3. Electric vehicle charging
4. Timer-based appliances such as laundry, dishwasher, or other scheduled loads

这个 demo 主要考虑四类可灵活安排的用电设备：

1. 储能电池
2. 热泵热水或类似热负荷
3. 电动车充电
4. 洗衣机、洗碗机等可预约家电

## Core User Flow / 核心使用流程

1. Edit the electricity tariff schedule.
   - Example: 00:00-06:00 negative price, 06:00-17:00 low price, 17:00-24:00 high price.
   - The editor always normalizes the day into a 24-hour schedule.
   - Adjacent periods with the same price are merged.

2. Select household devices.
   - Turn each device category on or off.
   - Adjust flexible energy amounts with sliders.
   - The app shows the unit and period, such as kWh per day or kWh per week.

3. Enter equipment cost.
   - The default demo uses a total cost.
   - Advanced settings can optionally split cost by enabled device.

4. Adjust advanced assumptions.
   - Battery round-trip efficiency
   - Battery cycles per day
   - Heat pump COP
   - Optional per-device cost split

5. Calculate the result.
   - The frontend first asks the backend API for a result.
   - If the backend is not available, the frontend uses the same local calculation model.

6. Review and share.
   - Estimated payback time
   - Estimated annual savings
   - Savings breakdown by device
   - Suggested daily energy plan
   - Share image generation
   - Scenario link saving when the backend is available

中文流程：

1. 编辑一天 24 小时电价。
   - 例如：00:00-06:00 负电价，06:00-17:00 低价，17:00-24:00 高价。
   - 电价编辑器会把输入整理成完整 24 小时覆盖。
   - 相邻且价格相同的时段会自动合并。

2. 选择家里可调度设备。
   - 每类设备可以开启或关闭。
   - 用滑块调整可移动电量或需求量。
   - 页面会显示 kWh/天、kWh/周等单位。

3. 填设备成本。
   - 默认按总成本计算回本。
   - 高级设置里可以按设备拆分成本。

4. 调高级参数。
   - 电池往返效率
   - 每天完整充放电次数
   - 热泵 COP
   - 可选的分设备成本

5. 点击计算。
   - 前端优先请求后端 API。
   - 如果后端不可用，前端会用本地同款算法兜底计算。

6. 查看和分享结果。
   - 预计回本时间
   - 预计年节省
   - 各设备节省贡献
   - 每日用电建议
   - 生成分享图片
   - 后端可用时保存方案并生成分享链接

## Example Default Estimate / 默认示例结果

With the default tariff shape and enabled devices, the demo estimates roughly:

| Metric | Approximate value |
|---|---:|
| Annual savings | 11,173 |
| Investment cost | 30,000 |
| Payback time | 2.7 years |
| Home battery contribution | 5,148 / year |
| Heat pump / hot water contribution | 1,363 / year |
| EV charging contribution | 3,640 / year |
| Timed appliances contribution | 1,022 / year |

中文说明：默认参数下，系统会估算年节省大约为 11,173，总投入为 30,000 时，回本时间约 2.7 年。这里的数值是演示模型的估算，不代表真实家庭一定会得到同样结果。

Important: currency switching changes display formatting only. It does not perform live exchange-rate conversion.

注意：货币切换只改变显示货币格式，不做实时汇率换算。

## Calculation Model / 计算模型

The calculation code lives in:

- Frontend: `src/lib/calculations.ts`
- Backend: `server/calculations.js`

The model expands tariff blocks into 24 hourly prices, then estimates savings from shifting flexible energy use away from expensive hours and into cheaper hours.

High-level model:

1. Normalize tariff blocks.
2. Expand the tariff into 24 hourly prices.
3. Identify cheap and expensive windows.
4. For each enabled device:
   - Estimate daily or weekly flexible kWh.
   - Estimate a low charging or usage rate.
   - Estimate an avoided high-price rate.
   - Calculate the positive price spread.
   - Annualize the savings.
5. Sum device contributions.
6. Divide investment cost by annual savings to estimate payback years.

中文解释：

1. 先规范化电价时段。
2. 把电价展开成 24 个小时价格。
3. 找出便宜时段和贵时段。
4. 对每个启用设备：
   - 估算每天或每周可移动电量。
   - 估算低价时段用电/充电成本。
   - 估算高价时段原本需要避免的购电成本。
   - 计算正向价差。
   - 折算成年节省。
5. 汇总各设备节省。
6. 用投资成本除以年节省，得到预计回本年限。

This is intentionally an estimation model, not a full energy simulation. It does not model weather, exact household load curves, solar export limits, battery degradation, charger power limits by device, network charges, tax, or real-time market settlement rules.

这个模型是为了演示和粗估，不是完整能源仿真。它没有模拟天气、真实家庭负荷曲线、光伏上网限制、电池衰减、具体设备功率限制、网络费用、税费或实时市场结算规则。

## Architecture / 技术结构

```text
energy-payback-calculator
├── src/
│   ├── App.tsx                  # Main React app and screen flow
│   ├── styles.css               # Mobile-first visual design
│   └── lib/
│       ├── calculations.ts       # Frontend calculation model
│       ├── tariffEditor.ts       # Tariff editing and 24-hour normalization
│       ├── i18n.ts               # Chinese, English, German, French, Italian copy
│       ├── storage.ts            # LocalStorage persistence
│       ├── api.ts                # Backend API client
│       ├── shareImage.ts         # Canvas-based PNG share image generation
│       └── types.ts              # Shared TypeScript types
├── server/
│   ├── index.js                 # Express API and static file serving
│   └── calculations.js           # Backend calculation model
├── docs/
│   ├── assets/                  # Screenshots used by README and docs
│   ├── DEMO.md                  # Bilingual demo walkthrough
│   ├── PITCH.md                 # Bilingual presentation / speech script
│   └── TECHNICAL_OVERVIEW.md    # More detailed implementation notes
├── data/
│   └── .gitkeep                 # Scenario JSON files are generated locally and ignored
└── package.json                 # Scripts, metadata, and dependencies
```

## Frontend / 前端

The frontend is built with React, TypeScript, Vite, Framer Motion, and Lucide icons.

Main frontend responsibilities:

- Render the mobile-first app shell.
- Handle tariff editing and validation.
- Manage device toggles and sliders.
- Persist user input in LocalStorage.
- Call the backend API when available.
- Fall back to local calculation when the backend is unavailable.
- Render animated result values.
- Generate a share image with the Canvas API.
- Switch language and currency display.

前端负责：

- 渲染移动优先页面。
- 编辑和校验电价时段。
- 管理设备开关和滑块。
- 把用户输入保存到 LocalStorage。
- 后端可用时请求 API。
- 后端不可用时本地计算兜底。
- 动态展示结果数值。
- 用 Canvas 生成分享图片。
- 切换语言和货币显示。

## Backend / 后端

The backend is a small Express server.

Available endpoints:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/calculate` | Calculate savings from a submitted state |
| POST | `/api/scenarios` | Save a state/result snapshot |
| GET | `/api/scenarios/:id` | Load a saved scenario |

Saved scenario files are written to `data/*.json`. They are ignored by Git so personal or temporary calculation snapshots are not uploaded.

后端是一个简单的 Express 服务，主要做四件事：

1. 健康检查。
2. 接收用户输入并计算结果。
3. 保存分享方案。
4. 根据方案 ID 读取已保存方案。

`data/*.json` 是运行时生成的分享方案文件，默认不会提交到 GitHub。

## Run Locally / 本地运行

Install dependencies:

```bash
npm install
```

Run the full app with backend and Vite dev server:

```bash
npm run dev:full
```

The backend runs on:

```text
http://localhost:8787
```

Vite runs on its own port and calls the backend at `http://localhost:8787`.

Build and run the production version locally:

```bash
npm run build
npm run start
```

Open:

```text
http://localhost:8787
```

## Verification / 验证

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

Optional audit:

```bash
npm audit --omit=dev
```

Current verified status before publishing:

- 7 test files passed
- 32 tests passed
- Production build passed

## Documentation / 文档

More detailed bilingual material:

- [Demo walkthrough / 展示流程](docs/DEMO.md)
- [Presentation script / 演说稿](docs/PITCH.md)
- [Technical overview / 技术说明](docs/TECHNICAL_OVERVIEW.md)
- [Screenshot index / 截图索引](docs/SCREENSHOTS.md)

## Limitations / 限制

This project is a demo-level estimator. It is useful for explanation, comparison, and product demonstration, but it should not be treated as engineering design advice, investment advice, or a utility-bill guarantee.

Known limitations:

- No live tariff import.
- No exchange-rate conversion.
- No detailed household load profile.
- No solar generation model.
- No battery degradation curve.
- No real-time power constraints per device.
- No tax, rebate, grid charge, or demand charge model.
- GitHub Pages static hosting cannot run the Express backend.

中文说明：

这个项目适合做展示、解释和粗略比较，但不能当成工程设计建议、投资建议或电费账单保证。

已知限制：

- 没有实时导入电价。
- 没有汇率换算。
- 没有真实家庭负荷曲线。
- 没有光伏发电模型。
- 没有电池衰减曲线。
- 没有按设备建模功率上限。
- 没有税费、补贴、电网附加费或需量电费模型。
- GitHub Pages 静态托管不能运行 Express 后端。

## Security / 安全说明

No API keys or private credentials are required for this project.

The repository intentionally ignores:

- `.env`
- `.env.*`
- `node_modules/`
- `dist/`
- `.playwright-cli/`
- `data/*.json`
- log files
- coverage output

The saved scenario JSON files are runtime data and are not meant to be committed.

本项目不需要 API 密钥，也不应该提交任何私钥、令牌或环境变量文件。运行时保存的分享方案属于本地数据，默认不上传。

## License / 许可

MIT License. See [LICENSE](LICENSE).
