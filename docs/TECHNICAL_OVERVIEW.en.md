<p align="right">
  <strong>English</strong> · <a href="./TECHNICAL_OVERVIEW.zh-CN.md">简体中文</a>
</p>

# Technical Overview

This document describes the implementation of Energy Payback Calculator: its application state, tariff editor, savings model, API, fallback behavior, persistence, testing, deployment, and security boundaries.

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Framer Motion
- Lucide React
- Canvas API for PNG share-image generation
- LocalStorage for browser persistence

### Backend

- Node.js
- Express
- CORS middleware
- File-based scenario storage under `data/`

### Testing

- Vitest
- Testing Library
- jsdom

## Main Files

| File | Responsibility |
|---|---|
| `src/App.tsx` | Main React application, input and result flows, drawers, and actions |
| `src/styles.css` | Responsive mobile-first interface styling |
| `src/lib/calculations.ts` | Browser-side savings and payback model |
| `src/lib/tariffEditor.ts` | Tariff expansion, normalization, update, and deletion helpers |
| `src/lib/i18n.ts` | Interface translations |
| `src/lib/defaults.ts` | Default state, language choices, and currency choices |
| `src/lib/storage.ts` | LocalStorage serialization and restoration |
| `src/lib/api.ts` | Calculation and scenario API client |
| `src/lib/shareImage.ts` | Canvas-based result image generation |
| `src/lib/types.ts` | Shared frontend TypeScript types |
| `server/index.js` | Express routes and production static-file serving |
| `server/calculations.js` | Server-side savings and payback model |

## Application State

The central input shape is `CalculatorState`. It contains:

- `language`: selected interface language.
- `currency`: selected number and symbol format.
- `tariffBlocks`: visible time ranges and prices.
- `assets`: enabled state and energy amount for each device category.
- `totalCost`: total equipment investment.
- `advanced`: efficiency, cycles, COP, and optional cost allocation.

The central output shape is `CalculationResult`. It contains:

- `hourlyPrices`: normalized 24-hour tariff.
- `annualSavings`: combined estimated yearly savings.
- `paybackYears`: investment cost divided by annual savings.
- `investmentCost`: cost used for the result.
- `contributions`: annual savings by device category.
- `cheapHours`: suggested lower-price periods.
- `expensiveHours`: suggested higher-price periods.
- `averageRate`: average hourly tariff value.

Language and currency are stored with the calculator state because they affect presentation and restored scenarios. Currency selection does not perform exchange-rate conversion.

## Tariff Editing Model

The user edits ranges such as:

```ts
{
  startHour: 0,
  endHour: 6,
  pricePerKwh: -0.2,
}
```

The visible range model is convenient for users, while the calculation needs a consistent price for each hour. Tariff utilities therefore convert between blocks and a 24-value hourly array.

Important helpers include:

- `normalizeHour`
- `expandTariffBlocks`
- `blocksToHourlyPrices`
- `hourlyPricesToBlocks`
- `normalizeTariffBlocksForEditing`
- `coverTariffRange`
- `updateTariffBlockRange`
- `deleteTariffBlock`

The editor follows these rules:

1. Hours are constrained to valid values.
2. Every block covers at least one hour.
3. Missing hours receive a fallback price.
4. Overlaps are resolved through hourly expansion.
5. Updates replace the selected range in the hourly model.
6. Adjacent hours with the same price are merged back into one block.
7. The final editable schedule covers the complete day.
8. Negative prices remain valid values throughout the conversion.

This approach keeps the user-facing editor understandable while giving the calculation a deterministic 24-hour input.

## Savings and Payback Model

The model compares lower-cost use with higher-cost grid purchases that can be avoided. Only a positive economic spread contributes savings.

### Home Battery

Battery discharge is based on usable capacity and the configured number of daily cycles. Charging energy is adjusted for round-trip efficiency.

Conceptually:

```text
daily discharge = usable capacity * cycles per day
charging energy = daily discharge / efficiency
daily savings = max(0, avoided high-rate cost - low-rate charging cost)
annual savings = daily savings * 365
```

An equivalent simplified rate expression is:

```text
dailyDischargeKwh * max(0, avoidedRate - lowRate / efficiency) * 365
```

The estimate assumes the configured flexible energy can be charged and discharged in the selected periods. It does not enforce charger or inverter power limits and does not include battery degradation.

### Heat Pump or Hot Water

Heat demand is converted to electrical demand using the heat pump coefficient of performance:

```text
electrical kWh = heat demand kWh / COP
```

The model then compares low-price operation with expensive operation that could be avoided and annualizes the positive difference over 365 days.

### Electric Vehicle Charging

Electric vehicle demand is entered as flexible energy per week. The model moves that demand to cheaper periods and annualizes the tariff difference over 52 weeks.

```text
annual savings = weekly flexible kWh * positive price spread * 52
```

The demo does not model individual charging sessions, state of charge, charger power, departure time, or required minimum range.

### Timer-Based Appliances

Timer-based appliances use a daily flexible kWh amount. Their estimated annual savings are:

```text
annual savings = daily flexible kWh * positive price spread * 365
```

This category represents loads such as laundry and dishwashing that can be delayed without additional storage.

### Combined Result

Each enabled device produces a non-negative annual contribution. The final result is:

```text
total annual savings = sum of enabled device contributions
payback years = investment cost / total annual savings
```

If total annual savings are zero, the application reports no finite payback rather than dividing by zero.

## Backend API

### `GET /api/health`

Purpose: verify that the Express service is available.

Example response:

```json
{
  "ok": true,
  "service": "energy-payback-api"
}
```

### `POST /api/calculate`

Purpose: calculate a result from submitted calculator state.

Request shape:

```json
{
  "state": {
    "...": "CalculatorState"
  }
}
```

Response shape:

```json
{
  "result": {
    "...": "CalculationResult"
  },
  "source": "server"
}
```

### `POST /api/scenarios`

Purpose: save a state and result snapshot.

Request shape:

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

Response shape:

```json
{
  "scenario": {
    "id": "generated-id"
  },
  "id": "generated-id"
}
```

### `GET /api/scenarios/:id`

Purpose: load a saved scenario from `data/:id.json`.

Scenario storage is intentionally simple for a demo. There is no user account, authorization layer, database, expiration policy, or multi-instance synchronization.

## Frontend Calculation Fallback

When the user calculates:

1. The frontend calls `calculateOnServer(state)`.
2. A successful response is presented as a server-calculated result.
3. A failed request is caught by the frontend.
4. The frontend calls `calculateSavings(state)` locally.
5. The same result screen remains available.

This fallback supports three useful cases:

- Static hosting such as GitHub Pages.
- Frontend development without the Express server.
- Temporary API unavailability during a demonstration.

The tradeoff is that frontend and backend calculation implementations must stay aligned. Tests cover key behavior on both sides, but a shared package would be preferable if the model became larger.

## Browser Persistence

Calculator input is stored in LocalStorage so an accidental refresh does not erase the current setup. Restoration code validates and combines stored values with defaults rather than assuming all fields exist.

LocalStorage is browser-local convenience storage. It is not an authenticated account, cross-device synchronization system, or secure place for sensitive information.

## Scenario and Share Flow

The result-sharing sequence is:

1. Submit current state and result to `/api/scenarios`.
2. Receive a generated scenario identifier.
3. Create a URL containing `?scenario=<id>`.
4. Copy the link when Clipboard API access is available.
5. Render a result summary to Canvas.
6. Export the Canvas content as a PNG image.

If scenario saving fails, the app still attempts to generate the image. On static hosting, share-image generation remains available while persistent scenario links do not.

## Internationalization and Currency Display

Interface copy is defined centrally in `src/lib/i18n.ts`. Included interface languages are English, Chinese, German, French, and Italian.

The language selection changes labels, actions, explanations, result copy, and generated share-image text. Currency selection changes symbols and number formatting. It does not call an exchange-rate service or convert stored numeric values.

The repository documentation is separate from interface localization. English documentation uses `.en.md` files, while Chinese documentation uses `.zh-CN.md` files, with a language link at the top of each document.

## Test Coverage

The automated suite covers:

- Expansion of tariff blocks into 24 hourly prices.
- Negative-price handling.
- Invalid-hour normalization.
- Cheap and expensive period selection.
- Savings calculation for all four device categories.
- Flat tariffs that produce no finite payback.
- Tariff editor add, update, delete, coverage, and merge behavior.
- LocalStorage persistence and restoration.
- Formatting helpers.
- Language and currency switching.
- Main input-to-result application flow.
- Share-image generation behavior.
- Backend calculation behavior and parity-sensitive cases.

Run the suite with:

```bash
npm test
```

Build the production frontend with:

```bash
npm run build
```

## Deployment

### GitHub Pages

Build the static frontend for this repository subpath:

```bash
VITE_BASE_PATH=/energy-payback-calculator/ npm run build
```

The generated asset paths then work at:

```text
https://jiexiaozhang1.github.io/energy-payback-calculator/
```

GitHub Pages serves only static files. Browser calculation and share-image generation work, but Express API calculation and scenario persistence do not.

### Node.js Hosting

For the complete application on a Node-capable host:

```bash
npm ci
npm run build
npm run start
```

Set the `PORT` environment variable when required by the hosting provider. A production deployment should also replace file-based scenario storage with a suitable database and add authentication, validation, retention, and rate limiting as appropriate.

## Security Boundaries

The current demo does not require API keys. Git ignores:

- `.env` and `.env.*`
- `data/*.json`
- `node_modules/`
- `dist/`
- `.playwright-cli/`
- log files
- coverage output

Generated scenario files may contain user-entered assumptions and therefore are treated as local runtime data. They are not committed to the repository.

The demo does not provide authentication or private scenario access. Do not use its file storage for sensitive personal, financial, or energy-consumption data without adding appropriate security controls.

## Engineering Limitations

The current model does not include:

- Measured household load profiles.
- Weather-dependent heating demand.
- Solar generation and export constraints.
- Battery degradation and replacement cost.
- Device charging and discharge power limits.
- Grid charges, taxes, subsidies, or demand charges.
- Live tariffs or exchange rates.
- User accounts, authorization, or a managed database.
- Probabilistic ranges or sensitivity analysis.

These are deliberate boundaries for a clear demonstration model. They should be addressed before the calculator is used for engineering or financial decisions.

Return to the [English README](../README.md) or use the [English presentation scripts](PITCH.en.md).
