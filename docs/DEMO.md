# Demo Walkthrough / 展示流程

This document explains how to present the Energy Payback Calculator demo step by step. It is written for a live walkthrough, a class presentation, a portfolio review, or a GitHub project showcase.

这份文档用于现场展示这个“家庭用电回本计算器”。可以用在课堂展示、作品集讲解、GitHub 项目介绍或面试项目说明中。

## 1. One-Sentence Introduction / 一句话介绍

English:

This demo estimates how much a household may save by moving flexible electricity use into cheaper tariff periods, and how many years it may take for the equipment investment to pay back.

中文：

这个 demo 用来估算一个家庭把可移动用电挪到低价时段后，一年大概能省多少钱，以及设备投入大概几年能回本。

## 2. Problem Setup / 问题背景

English:

Many electricity plans no longer have one flat price across the whole day. Prices may be low overnight, normal during the day, and high during the evening peak. In some markets, prices can even become negative for a few hours. This creates an opportunity: if a household can shift charging, heating, or appliance use into cheap periods, it may reduce its electricity cost.

中文：

很多电价不再是全天一个固定价格，而是一天里不同时段价格不同。比如凌晨很便宜，白天正常，傍晚高峰很贵，有些市场甚至会出现负电价。这样就出现了一个机会：如果家庭能把充电、热水、家电运行等用电行为挪到便宜时段，就可能降低电费。

## 3. Open The App / 打开应用

Local production run:

```bash
npm install
npm run build
npm run start
```

Open:

```text
http://localhost:8787
```

Development run:

```bash
npm run dev:full
```

Static online demo:

```text
https://jiexiaozhang1.github.io/energy-payback-calculator/
```

Optional static GitHub Pages build:

```bash
VITE_BASE_PATH=/energy-payback-calculator/ npm run build
```

GitHub Pages note:

A static page can run the local calculation fallback, but backend scenario saving requires the Express server.

GitHub Pages 说明：

静态展示页可以使用前端本地计算，但保存分享方案需要 Express 后端。

## 4. Input Page / 输入页

Screenshot:

![Input screen](assets/screenshot-input-zh.png)

What to show:

1. Language and currency selectors at the top.
2. The mobile-first layout.
3. The 24-hour tariff timeline.
4. The four device cards.
5. The total equipment cost input.
6. The advanced parameter drawer.

中文展示点：

1. 顶部可以切换语言和货币。
2. 整体是移动优先布局。
3. 电价用一天 24 小时时间轴展示。
4. 四类设备用卡片展示。
5. 用户可以输入设备总成本。
6. 高级参数可以展开，调整效率和成本拆分。

Suggested explanation:

English:

The first screen is intentionally kept simple. The user does not need to build a complex model. They enter tariff periods, choose flexible devices, enter the investment cost, and then calculate.

中文：

第一页尽量做得直接，不要求用户先建立复杂模型。用户只需要填电价时段、选设备、填成本，再点击计算。

## 5. Tariff Editing / 电价编辑

Screenshot:

![Tariff editor](assets/screenshot-tariff-editor-zh.png)

What to show:

1. Tap a price block on the tariff timeline.
2. The bottom drawer opens.
3. Start time, end time, and price can be edited.
4. Negative prices are supported.
5. The tariff editor keeps the day covered from 00:00 to 24:00.
6. Adding or deleting blocks still keeps the schedule valid.

中文展示点：

1. 点击时间轴上的任意电价块。
2. 底部抽屉会打开。
3. 可以改开始时间、结束时间和每 kWh 电价。
4. 支持负电价。
5. 编辑器会保证 00:00 到 24:00 都有价格覆盖。
6. 新增或删除时段后，也会保持一天时间表完整。

Suggested explanation:

English:

The tariff editor is not just a form. It normalizes overlapping, missing, or changed periods into a clean 24-hour tariff schedule. This matters because the calculation depends on hourly prices.

中文：

电价编辑器不是普通表单。它会把重叠、缺失或被修改的时段整理成完整的 24 小时电价表，因为后面的计算依赖每个小时的价格。

## 6. Device Selection / 设备选择

What to show:

1. Home battery.
2. Heat pump or hot water load.
3. EV charging.
4. Timed appliances.

Each card can be turned on or off. When enabled, the user can adjust the flexible kWh amount.

中文展示点：

1. 储能电池。
2. 热泵热水。
3. 电动车充电。
4. 可预约家电。

每张卡片可以开关。开启后可以调整对应的可移动电量或需求量。

Suggested explanation:

English:

The demo is based on flexible load. The app does not assume every household load can move. It only estimates savings from the selected device categories.

中文：

这个 demo 的核心是“可移动负荷”。它不是假设家里所有电都能随便挪，而是只估算用户选择的这些设备能带来的节省。

## 7. Advanced Parameters / 高级参数

What to show:

1. Battery round-trip efficiency.
2. Battery cycles per day.
3. Heat pump COP.
4. Optional cost split by device.

中文展示点：

1. 电池往返效率。
2. 每天完整充放电次数。
3. 热泵 COP。
4. 可选的设备成本拆分。

Suggested explanation:

English:

The default view stays simple, while the advanced panel gives more control to users who understand efficiency and equipment assumptions.

中文：

默认页面保持简单，但高级参数给懂设备效率和成本假设的用户更多控制空间。

## 8. Result Page / 结果页

Screenshot:

![Result screen](assets/screenshot-result-en.png)

What to show:

1. Estimated payback time.
2. Estimated annual savings.
3. Backend calculation status.
4. Annual savings by device.
5. Daily energy plan.
6. Share image button.
7. Edit inputs button.

中文展示点：

1. 预计回本时间。
2. 预计年节省。
3. 后端计算状态。
4. 各设备节省贡献。
5. 每日用电建议。
6. 分享图片按钮。
7. 返回修改参数按钮。

Suggested explanation:

English:

The result is designed to be understandable without reading a technical report. The top number answers the main question, and the sections below explain where the savings come from.

中文：

结果页的目标是让用户不用看技术报告也能理解。顶部回答“多久回本”，下面说明“钱主要从哪里省出来”。

## 9. Backend Behavior / 后端行为

What to show:

1. In local production mode, the frontend calls `/api/calculate`.
2. The backend calculates the same result model.
3. If the backend is unavailable, the frontend falls back to local calculation.
4. Saving a scenario writes a JSON file under `data/`.
5. Shared scenario links load the saved state and result.

中文展示点：

1. 本地生产模式下，前端会请求 `/api/calculate`。
2. 后端使用同款计算模型。
3. 如果后端不可用，前端会本地计算兜底。
4. 保存方案时会在 `data/` 下写 JSON。
5. 分享链接可以恢复保存过的输入和结果。

Suggested explanation:

English:

The backend is intentionally small. It exists to show an API-backed version of the calculator and to support scenario sharing. The frontend still remains usable without it.

中文：

后端故意保持很小。它主要用于展示 API 版计算和分享方案保存。即使没有后端，前端核心计算仍然可用。

## 10. Closing Summary / 收尾总结

English:

This demo turns a practical energy pricing question into a usable calculator. It combines an editable tariff model, flexible device assumptions, a simple payback calculation, a mobile-first interface, bilingual documentation, and a small backend for API calculation and scenario sharing.

中文：

这个 demo 把一个实际的家庭能源问题做成了可操作的计算器。它包含可编辑电价、可移动设备假设、回本估算、移动优先界面、中英文文档，以及一个用于 API 计算和方案分享的小后端。
