# Presentation Script / 演说稿

This document contains bilingual scripts for presenting the project. The wording is direct and practical, avoiding exaggerated claims.

这份文档提供中英文演说稿。语气尽量清楚、实在，不夸大项目能力。

## 30-Second English Version

This project is a household energy payback calculator. It lets users enter electricity prices for different times of day, select flexible devices such as a home battery, heat pump, EV charging, and timer-based appliances, and enter the equipment cost. The app estimates how much each device category may save per year by using electricity during cheaper periods and avoiding expensive peak periods. It also estimates the payback time. The frontend handles the interactive experience, tariff editing, language and currency switching, result display, and share image generation. The backend provides the calculation API and saved scenario support.

## 30 秒中文版本

这个项目是一个家庭用电回本计算器。用户可以输入一天里不同时段的电价，选择家里的可调度设备，比如储能电池、热泵热水、电动车充电和可预约家电，再填设备成本。系统会按照“便宜时段多用电或充电，贵时段少从电网买电”的思路，估算每类设备一年大概能省多少钱，以及整体大概几年能回本。前端负责交互、电价编辑、语言货币切换、结果展示和分享图片生成，后端负责计算 API 和保存分享方案。

## 90-Second English Version

Energy prices are becoming more time-dependent. In some places, electricity can be cheap overnight, more expensive in the evening, and sometimes even negative for a few hours. For households with flexible devices, that price difference can matter.

This demo turns that situation into a simple calculator. The user first defines the daily electricity tariff, including negative, low, and high price periods. Then they choose which flexible devices they have at home: a battery, heat pump or hot water load, EV charging, and timer-based appliances. They can also adjust equipment cost and efficiency assumptions.

After calculation, the app shows three things clearly: the estimated payback time, the estimated annual savings, and how much each device category contributes. It also gives a simple daily energy plan, showing cheap hours to use or charge and expensive hours to avoid buying from the grid.

Technically, the project uses React, TypeScript, Vite, Framer Motion, and a small Express backend. The frontend can calculate locally when the backend is unavailable, while the backend supports API calculation and saved scenario links. This makes the demo useful both as a standalone frontend and as a small full-stack application.

The goal is not to predict every household bill perfectly. The goal is to make the tradeoff understandable: if flexible electricity use can move into cheaper periods, the app gives a practical first estimate of savings and payback.

## 90 秒中文版本

现在很多地方的电价不再是全天固定价格，而是越来越依赖时间。比如凌晨便宜，傍晚高峰贵，有些市场甚至会出现几个小时的负电价。对有储能、电动车、热泵或可预约家电的家庭来说，这个价差可能会影响实际电费。

这个 demo 就是把这个问题做成一个简单的计算器。用户先设置一天里的电价时段，包括负价、低价和高价。然后选择家里有哪些可灵活安排用电的设备，比如储能电池、热泵热水、电动车充电、可预约家电。用户还可以调整设备成本和效率参数。

计算后，页面会清楚展示三件事：预计多久回本、每年大概省多少钱、每类设备分别贡献多少节省。结果页还会给一个简单的每日用电建议，告诉用户哪些时段更适合用电或充电，哪些高价时段应该尽量少从电网买电。

技术上，这个项目使用 React、TypeScript、Vite、Framer Motion 和一个小型 Express 后端。前端在后端不可用时可以本地计算，后端则支持 API 计算和保存分享方案。因此它既能作为独立前端 demo，也能作为一个小型全栈应用展示。

这个项目的目标不是精准预测每个家庭的真实电费账单，而是把“可移动用电是否值得投入”这个问题讲清楚，并给出一个实用的第一版估算。

## 3-Minute English Version

Today I am presenting a web application called Energy Payback Calculator. It is a small full-stack demo focused on household electricity savings under time-of-use pricing.

The background is that many electricity plans no longer use one fixed price for the whole day. A household may see cheaper electricity overnight, normal rates during the day, and expensive peak rates in the evening. In some markets, there can even be negative-price hours. For households with flexible loads, this creates a practical question: if we move some usage into cheaper periods, how much could we save, and how long would it take to recover the cost of the equipment?

The app answers that question in a simple workflow. First, the user edits the daily tariff schedule. The tariff editor supports negative prices, custom time periods, adding periods, deleting periods, and normalizing the day into a complete 24-hour schedule. This is important because the calculation works from hourly prices.

Second, the user selects the flexible devices available at home. The demo includes four categories: home battery, heat pump or hot water load, EV charging, and timer-based appliances. These categories are common examples of household electricity use that can be shifted in time.

Third, the user enters the investment cost and optional advanced assumptions. Advanced parameters include battery efficiency, battery cycles per day, heat pump COP, and optional per-device cost split.

After the user clicks calculate, the app estimates annual savings and payback time. The result page shows the main payback number, annual savings, a breakdown by device category, and a simple daily energy plan. It also supports share image generation. When the backend is available, it can save scenarios and load them again through a share link.

The frontend is built with React, TypeScript, Vite, Framer Motion, and Lucide icons. The backend is built with Express. The same calculation model exists on both sides: the frontend can fall back to local calculation, while the backend provides an API-backed version and scenario storage.

The project is intentionally clear rather than overly complex. It does not claim to replace a full engineering simulation. It does not model weather, exact household load curves, detailed battery degradation, taxes, rebates, or real-time market settlement. Instead, it gives users a useful estimate and makes the pricing logic easy to understand.

In short, this demo shows how an energy pricing problem can become a practical calculator with real interaction, a backend API, saved scenarios, bilingual documentation, and a presentable mobile-first interface.

## 3 分钟中文版本

今天我展示的是一个叫 Energy Payback Calculator 的网页应用，也可以叫家庭用电回本计算器。它是一个小型全栈 demo，重点是估算家庭在分时电价下，通过调整用电时间大概能省多少钱、多久能回本。

背景是现在很多电价已经不是全天一个固定价格。一个家庭可能会遇到凌晨电价低、白天正常、傍晚高峰贵的情况。有些市场甚至会在部分时段出现负电价。对有可调度用电设备的家庭来说，这就带来一个很实际的问题：如果把一部分用电挪到便宜时段，一年能省多少钱？为了实现这件事买的设备，大概几年能回本？

这个应用用比较简单的流程回答这个问题。第一步，用户编辑一天 24 小时的电价。电价编辑器支持负电价、自定义时段、新增时段、删除时段，并且会把一天整理成完整的 24 小时电价表。这样做很重要，因为后面的计算是按小时电价来的。

第二步，用户选择家里有哪些可灵活安排用电的设备。demo 里包含四类：储能电池、热泵热水、电动车充电、可预约家电。这几类都属于比较典型的、可以在时间上调整的家庭用电。

第三步，用户输入设备投入成本，也可以打开高级参数。高级参数包括电池往返效率、每天充放电次数、热泵 COP，以及可选的按设备拆分成本。

点击计算后，应用会估算年节省和回本时间。结果页会展示主要回本数字、每年大概省多少钱、各类设备分别贡献多少节省，以及一个简单的每日用电建议。它也支持生成分享图片。如果后端可用，还可以保存方案，并通过分享链接恢复这个方案。

技术上，前端使用 React、TypeScript、Vite、Framer Motion 和 Lucide 图标。后端使用 Express。前端和后端都有同款计算模型：前端可以在后端不可用时本地计算，后端则提供 API 计算和方案保存。

这个项目有意保持清楚，不追求把所有能源系统细节都塞进去。它不声称能替代完整工程仿真，也没有模拟天气、真实家庭负荷曲线、电池衰减、税费、补贴或实时市场结算。它的价值是给用户一个实用的第一版估算，并且把“便宜时用电、贵时少买电”这个逻辑讲明白。

简单说，这个 demo 展示了如何把一个能源价格问题做成一个可操作的计算器：有真实交互、有后端 API、有方案保存、有中英文文档，也有适合展示的移动优先界面。

## Q&A Talking Points / 问答提示

Question: Is this a real financial calculator?

Answer: It is an estimation tool. It is useful for understanding the rough relationship between tariff spread, flexible energy, annual savings, and payback time. It is not a bill guarantee or investment recommendation.

问题：这是不是一个真实财务计算器？

回答：它是估算工具。它适合用来理解电价价差、可移动电量、年节省和回本时间之间的大致关系，但不是账单保证，也不是投资建议。

Question: Why does the frontend also calculate locally?

Answer: It keeps the demo usable even when the backend is unavailable, including on static hosting such as GitHub Pages. The backend still matters for API calculation and saved scenario links.

问题：为什么前端也做本地计算？

回答：这样即使后端不可用，demo 仍然能用，比如部署到 GitHub Pages 这种静态托管时。后端仍然用于 API 计算和保存分享方案。

Question: What is the strongest part of the project?

Answer: The project connects a real-world energy pricing concept to a usable interface. The tariff editor, fallback calculation, share flow, bilingual copy, and tests make it more than a static mockup.

问题：这个项目最有价值的地方是什么？

回答：它把一个真实的能源价格问题做成了可用界面。电价编辑器、本地兜底计算、分享流程、中英文文案和测试，让它不只是静态页面。
