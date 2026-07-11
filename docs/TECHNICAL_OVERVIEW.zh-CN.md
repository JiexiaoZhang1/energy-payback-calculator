<p align="right">
  <a href="./TECHNICAL_OVERVIEW.en.md">English</a> · <strong>简体中文</strong>
</p>

# 技术说明

这份文档说明家庭用电回本计算器的实现方式，包括应用状态、电价编辑器、节省模型、后端接口、前端兜底、状态保存、测试、部署和安全边界。

## 技术栈

### 前端

- React
- TypeScript
- Vite
- Framer Motion
- Lucide React
- 用于生成 PNG 分享图片的 Canvas API
- 用于浏览器本地状态保存的 LocalStorage

### 后端

- Node.js
- Express
- CORS 中间件
- `data/` 目录下基于文件的方案保存

### 测试

- Vitest
- Testing Library
- jsdom

## 主要文件

| 文件 | 作用 |
|---|---|
| `src/App.tsx` | React 主应用、输入和结果流程、抽屉与操作 |
| `src/styles.css` | 响应式移动端优先界面样式 |
| `src/lib/calculations.ts` | 浏览器端节省和回本计算 |
| `src/lib/tariffEditor.ts` | 电价展开、规范化、更新和删除工具 |
| `src/lib/i18n.ts` | 界面多语言文案 |
| `src/lib/defaults.ts` | 默认状态、语言选项和货币选项 |
| `src/lib/storage.ts` | LocalStorage 序列化和恢复 |
| `src/lib/api.ts` | 计算和方案 API 客户端 |
| `src/lib/shareImage.ts` | 基于 Canvas 的结果图片生成 |
| `src/lib/types.ts` | 前端共用 TypeScript 类型 |
| `server/index.js` | Express 路由和生产静态文件服务 |
| `server/calculations.js` | 后端节省和回本计算 |

## 应用状态

核心输入类型是 `CalculatorState`，其中包括：

- `language`：当前界面语言。
- `currency`：当前数字和货币符号格式。
- `tariffBlocks`：界面可见的时间范围和电价。
- `assets`：每类设备的启用状态和相关电量。
- `totalCost`：设备总投入。
- `advanced`：效率、循环次数、性能系数和可选成本拆分。

核心输出类型是 `CalculationResult`，其中包括：

- `hourlyPrices`：规范化后的 24 小时电价。
- `annualSavings`：合计预计年节省。
- `paybackYears`：设备投入除以年节省得到的回本年限。
- `investmentCost`：结果使用的投入成本。
- `contributions`：按设备分类的年节省贡献。
- `cheapHours`：建议使用的低价时段。
- `expensiveHours`：建议避开的高价时段。
- `averageRate`：一天 24 小时的平均电价。

语言和货币会随计算器状态一起保存，因为它们会影响页面展示和方案恢复。货币选择不会执行汇率换算。

## 电价编辑模型

用户编辑的是下面这种连续时段：

```ts
{
  startHour: 0,
  endHour: 6,
  pricePerKwh: -0.2,
}
```

连续时段方便用户理解，但计算需要每个小时都有一个确定价格。因此，电价工具会在时段数组和 24 项小时价格数组之间相互转换。

主要工具函数包括：

- `normalizeHour`
- `expandTariffBlocks`
- `blocksToHourlyPrices`
- `hourlyPricesToBlocks`
- `normalizeTariffBlocksForEditing`
- `coverTariffRange`
- `updateTariffBlockRange`
- `deleteTariffBlock`

编辑器遵循这些规则：

1. 小时数会被限制在有效范围内。
2. 每个时段至少覆盖一小时。
3. 缺失小时使用兜底价格。
4. 重叠范围通过按小时展开解决。
5. 更新操作会替换小时模型中的选定范围。
6. 价格相同的相邻小时会重新合并为一个时段。
7. 最终可编辑电价表覆盖完整一天。
8. 负电价在整个转换过程中保持有效。

这种处理方式让用户看到的编辑器足够直观，同时给计算逻辑提供确定的 24 小时输入。

## 节省和回本模型

模型比较低价时段用电成本和可以避免的高价购电成本。只有正向经济价差才会计入节省。

### 储能电池

电池放电量根据可用容量和每天循环次数计算，充电电量还会考虑往返效率。

概念公式如下：

```text
每天放电量 = 可用容量 * 每天循环次数
每天充电量 = 每天放电量 / 电池效率
每天节省 = max(0, 可避免的高价购电成本 - 低价充电成本)
每年节省 = 每天节省 * 365
```

对应的简化价格表达式为：

```text
dailyDischargeKwh * max(0, avoidedRate - lowRate / efficiency) * 365
```

这个估算假设所填的可移动电量可以在对应时段完成充放电。模型没有限制充电器或逆变器功率，也没有计算电池衰减。

### 热泵或热水

热需求先通过热泵性能系数换算为电需求：

```text
用电量 kWh = 热需求 kWh / COP
```

模型再比较低价运行和可以避免的高价运行成本，并把正向差额按 365 天折算成年节省。

### 电动车充电

电动车需求以每周可移动电量输入。模型把这部分需求安排到更便宜的时段，并按 52 周折算电价差：

```text
每年节省 = 每周可移动电量 * 正向电价差 * 52
```

Demo 没有模拟单次充电过程、电池剩余电量、充电器功率、出发时间或最低续航要求。

### 可预约家电

可预约家电使用每天可移动电量，预计年节省为：

```text
每年节省 = 每天可移动电量 * 正向电价差 * 365
```

这个分类代表洗衣、洗碗等不需要储能，但可以延后运行的负荷。

### 汇总结果

每个已开启设备都会得到一个不小于零的年节省贡献，最终结果为：

```text
总年节省 = 所有已开启设备的年节省之和
回本年限 = 设备投入 / 总年节省
```

如果总年节省为零，应用会显示没有有限回本时间，而不是直接除以零。

## 后端 API

### `GET /api/health`

作用：检查 Express 服务是否可用。

示例响应：

```json
{
  "ok": true,
  "service": "energy-payback-api"
}
```

### `POST /api/calculate`

作用：根据提交的计算器状态生成结果。

请求结构：

```json
{
  "state": {
    "...": "CalculatorState"
  }
}
```

响应结构：

```json
{
  "result": {
    "...": "CalculationResult"
  },
  "source": "server"
}
```

### `POST /api/scenarios`

作用：保存输入状态和结果快照。

请求结构：

```json
{
  "state": {
    "...": "CalculatorState"
  },
  "result": {
    "...": "CalculationResult"
  }
}
```

响应结构：

```json
{
  "scenario": {
    "id": "generated-id"
  },
  "id": "generated-id"
}
```

### `GET /api/scenarios/:id`

作用：从 `data/:id.json` 读取已保存方案。

基于文件的方案保存只用于 Demo。当前没有用户账号、权限控制、数据库、过期策略或多实例数据同步。

## 前端计算兜底

用户点击计算时会发生下面的流程：

1. 前端调用 `calculateOnServer(state)`。
2. 请求成功时，结果会标记为后端计算。
3. 请求失败时，前端捕获错误。
4. 前端改为本地调用 `calculateSavings(state)`。
5. 结果页在两种情况下都可以继续使用。

这个兜底适合三个场景：

- GitHub Pages 这类静态托管。
- 不启动 Express 服务的前端开发。
- 现场演示时 API 暂时不可用。

它的代价是前后端两套计算实现必须保持一致。现有测试覆盖了两边的重要行为；如果模型继续变大，更适合把计算逻辑提取到共用包中。

## 浏览器状态保存

计算器输入会写入 LocalStorage，避免用户意外刷新页面后丢失当前设置。恢复逻辑会检查已保存内容，并与默认值合并，不会假设历史数据一定包含所有新字段。

LocalStorage 只是当前浏览器中的便利存储，不是登录账号、跨设备同步系统，也不适合保存敏感信息。

## 方案和分享流程

结果分享流程如下：

1. 把当前状态和结果提交到 `/api/scenarios`。
2. 获取自动生成的方案编号。
3. 创建带有 `?scenario=<id>` 的网址。
4. 浏览器允许访问剪贴板时复制链接。
5. 把结果摘要绘制到 Canvas。
6. 把 Canvas 内容导出为 PNG 图片。

如果方案保存失败，应用仍会尝试生成图片。在静态托管环境中，分享图片可以使用，但不能生成可持久恢复的方案链接。

## 多语言和货币显示

界面文案集中定义在 `src/lib/i18n.ts`。项目包含中文、英文、德语、法语和意大利语界面。

语言选择会改变标签、操作、说明、结果文案和分享图片文字。货币选择只改变符号和数字格式，不会调用汇率服务，也不会转换已保存的数值。

仓库文档与应用界面多语言是两件事。英文文档使用 `.en.md` 文件，中文文档使用 `.zh-CN.md` 文件，每份文档顶部都有语言切换链接。

## 测试覆盖

自动测试覆盖：

- 把电价时段展开成 24 小时价格。
- 负电价处理。
- 无效小时规范化。
- 低价和高价时段选择。
- 四类设备的节省计算。
- 全天平价时没有有限回本时间。
- 电价编辑器新增、更新、删除、完整覆盖和合并行为。
- LocalStorage 状态保存和恢复。
- 格式化工具。
- 语言和货币切换。
- 从输入到结果的应用主流程。
- 分享图片生成行为。
- 后端计算行为和需要保持一致的关键情况。

运行测试：

```bash
npm test
```

构建生产前端：

```bash
npm run build
```

## 部署

### GitHub Pages

为当前仓库子路径构建静态前端：

```bash
VITE_BASE_PATH=/energy-payback-calculator/ npm run build
```

生成的资源路径会适配：

```text
https://jiexiaozhang1.github.io/energy-payback-calculator/
```

GitHub Pages 只提供静态文件。浏览器本地计算和分享图片可以使用，但 Express API 计算和方案持久保存不可用。

### Node.js 平台

在支持 Node.js 的平台部署完整应用：

```bash
npm ci
npm run build
npm run start
```

托管平台有要求时设置 `PORT` 环境变量。正式部署还应把基于文件的方案保存替换为合适的数据库，并根据实际用途加入身份验证、输入校验、数据保留策略和请求限流。

## 安全边界

当前 Demo 不需要 API 密钥。Git 已忽略：

- `.env` 和 `.env.*`
- `data/*.json`
- `node_modules/`
- `dist/`
- `.playwright-cli/`
- 日志文件
- 测试覆盖率输出

生成的方案文件可能包含用户填写的假设，所以被当作本地运行数据处理，不会提交到仓库。

Demo 没有用户登录或私有方案权限。没有补充相应安全控制前，不要用当前文件存储保存敏感的个人、财务或家庭能源数据。

## 工程限制

当前模型没有包括：

- 实际测量的家庭负荷曲线。
- 受天气影响的制热需求。
- 光伏发电和上网限制。
- 电池衰减和更换成本。
- 设备充放电功率上限。
- 电网附加费、税费、补贴或需量电费。
- 实时电价或汇率。
- 用户账号、权限控制或托管数据库。
- 概率范围或敏感性分析。

这些是为了让演示模型保持清楚而划定的边界。如果计算器要用于工程或财务决策，就必须补充这些内容。

可以返回[中文项目说明](../README.zh-CN.md)，或者查看[中文演说稿](PITCH.zh-CN.md)。
