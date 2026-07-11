<p align="right">
  <strong>English</strong> · <a href="./PITCH.zh-CN.md">简体中文</a>
</p>

# Presentation Scripts

These scripts can be read directly or adjusted for a class presentation, portfolio review, interview, recorded demo, or project introduction. The wording is deliberately practical and avoids claiming that the estimate is a guaranteed financial return.

## 30-Second Version

Energy Payback Calculator is a household electricity savings and payback estimator. Users enter electricity prices for different times of day, select flexible devices such as a home battery, heat pump, electric vehicle, and timer-based appliances, and provide the equipment cost. The app estimates how much each device category may save per year by using electricity during cheaper periods and avoiding expensive peak periods. It then estimates the total payback time. The frontend provides the complete interactive experience and local fallback calculation, while the Express backend provides a calculation API and saved-scenario support.

## 90-Second Version

Electricity prices are becoming more dependent on time. In some places, electricity is inexpensive overnight, more expensive in the evening, and occasionally negative for a few hours. For households with flexible devices, that price difference can have a real effect on electricity cost.

Energy Payback Calculator turns this situation into a simple web application. The user first defines a daily tariff, including negative, low, and high-price periods. They then choose which flexible devices are available at home: a battery, a heat pump or hot water load, electric vehicle charging, and timer-based appliances. Equipment cost and efficiency assumptions can also be adjusted.

After calculation, the application shows three things clearly: estimated payback time, estimated annual savings, and the contribution from each device category. It also gives a simple daily energy plan that identifies cheaper periods for charging or use and expensive periods when grid purchases should be reduced.

The frontend uses React, TypeScript, Vite, Framer Motion, and Lucide icons. A small Express backend provides API calculation and saved scenarios. If the backend is unavailable, the browser runs the same calculation model locally, so the static GitHub Pages demo remains usable.

The goal is not to predict every household bill perfectly. The goal is to make the relationship between tariff spread, flexible electricity use, annual savings, and equipment payback understandable enough for an initial comparison.

## 3-Minute Version

Today I am presenting a web application called Energy Payback Calculator. It is a small full-stack project focused on estimating household electricity savings and equipment payback under time-of-use pricing.

The background is that many electricity plans no longer use one fixed rate for the entire day. A household may see cheaper electricity overnight, ordinary rates during the day, and expensive peak rates in the evening. In some markets, electricity prices can even become negative for a few hours. For households with flexible loads, this creates a practical question: if some electricity use is moved into cheaper periods, how much money could be saved, and how long would it take to recover the cost of the equipment?

The application answers that question through a direct workflow. First, the user edits the daily tariff schedule. The editor supports negative prices, custom time periods, adding periods, deleting periods, and converting every edit into a complete 24-hour price schedule. This matters because the calculation is based on hourly prices.

Second, the user chooses the flexible devices available in the household. The demo includes four categories: a home battery, a heat pump or hot water load, electric vehicle charging, and timer-based appliances. These are common examples of household electricity use that can be shifted in time.

Third, the user enters the equipment investment cost and can open advanced assumptions. These include battery round-trip efficiency, battery cycles per day, heat pump coefficient of performance, and optional cost allocation by device.

When the user calculates, the app estimates annual savings and payback time. The result screen presents the main payback number, annual savings, savings by device category, and a simple daily energy plan. It can also generate a PNG share image. When the backend is available, the current state and result can be saved and loaded again through a scenario link.

The frontend is built with React, TypeScript, Vite, Framer Motion, and Lucide icons. The backend is built with Express. The same calculation model exists on both sides: the frontend can calculate locally when the API is unavailable, while the backend provides the API-backed path and file-based scenario storage.

The project intentionally keeps the estimate understandable. It does not claim to replace a complete engineering simulation. It does not model weather, exact household load curves, solar export, detailed battery degradation, taxes, subsidies, or real-time market settlement. Instead, it provides a practical first estimate and makes the pricing logic visible to the user.

In short, Energy Payback Calculator shows how a real energy-pricing question can become a usable application with editable inputs, an explainable result, a backend API, saved scenarios, share images, automated tests, and separate English and Chinese project documentation.

## 5-Minute Version

Energy Payback Calculator is a mobile-first web application for estimating household electricity savings under time-of-use tariffs. The project began with a straightforward question: when electricity prices change across the day, can a household save enough by shifting flexible electricity use to justify the cost of equipment such as a battery, heat pump, or smart charging setup?

The first part of the application is the tariff editor. A user can define negative, low, and high prices across a full day. The visible interface uses price blocks because that is easy to understand, but the calculation and editing utilities convert those blocks into 24 hourly values. This also allows the editor to resolve gaps and overlaps and then merge adjacent hours with the same price.

The second part is the device model. The application does not assume every electricity load can move. It provides four explicit categories. A home battery uses cheap energy to avoid expensive grid purchases, adjusted for round-trip efficiency. Heat demand is converted through the heat pump coefficient of performance. Electric vehicle demand is treated as weekly flexible charging energy. Timer-based appliances use a smaller daily shiftable amount.

The third part is the economic result. For each enabled category, the model calculates only a positive price spread and annualizes the estimated savings. It adds all device contributions and divides the entered investment cost by total annual savings. The result screen leads with the estimated payback period, then shows annual savings, the contribution breakdown, and cheap and expensive periods.

The frontend handles the entire user experience, including tariff editing, device controls, local persistence, language and currency formatting, result animation, and PNG share-image generation. The backend exposes health, calculation, save-scenario, and load-scenario endpoints. If the backend cannot be reached, the browser calculates locally, which is why the static GitHub Pages version still works.

The calculation is intentionally a first estimate. A production energy-planning tool would need real tariffs, measured load data, weather, solar generation, device power limits, degradation, grid charges, tax, and local market rules. This demo does not pretend to include those details. Its purpose is to make the main tradeoff understandable and to demonstrate a complete frontend and backend workflow around it.

## Question and Answer Notes

### Is this a real financial calculator?

It is an estimation tool. It is useful for understanding the rough relationship between tariff spread, flexible energy, annual savings, and payback time. It is not a bill guarantee, engineering recommendation, or investment recommendation.

### Why does the frontend also calculate locally?

Local calculation keeps the demo usable when the backend is unavailable, including on static hosting such as GitHub Pages. The backend is still used for the API path and saved-scenario links.

### Why is the same calculation implemented twice?

The two implementations support the server-backed and static fallback experiences. Tests check important behavior on both sides. In a larger production system, the shared model could be moved into a common package to reduce maintenance risk.

### What is the strongest part of the project?

The project connects a real energy-pricing concept to a complete, usable flow. The tariff editor, explainable breakdown, local fallback, sharing, localization, and automated tests make it more than a static visual mockup.

### What would be the next production step?

The next step would be to replace demonstration assumptions with location-specific tariffs and measured household data, then add authentication, a database, device power constraints, solar generation, degradation, taxes, grid charges, and sensitivity analysis.

### Does changing the currency convert the result?

No. Currency selection changes symbols and number formatting only. It does not request exchange rates or transform the entered amounts.

### Can the public GitHub Pages demo save scenarios?

No. GitHub Pages is static and cannot run the Express API or persist JSON files. Local or hosted Node.js deployment enables scenario saving and restoration.

For the live presentation sequence, see the [English demo walkthrough](DEMO.en.md).
