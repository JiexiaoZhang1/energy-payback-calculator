<p align="right">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

# Energy Payback Calculator

![Energy Payback Calculator input screen](docs/assets/screenshot-input-en.png)

Energy Payback Calculator is a mobile-first web application that estimates household electricity savings and equipment payback under time-of-use tariffs. It is designed for daily price schedules that may include negative overnight prices, lower daytime rates, and expensive evening peaks.

Users enter a 24-hour tariff schedule, select household devices whose electricity use can be shifted, and provide cost and efficiency assumptions. The calculator then estimates the annual savings contributed by each device category and the approximate number of years needed to recover the equipment investment.

The calculation follows a practical idea: charge or run flexible devices during cheaper periods and reduce grid purchases during expensive periods. This is an estimation tool for explanation and comparison, not a utility-bill guarantee or a complete engineering simulation.

## Live Demo

Open the static GitHub Pages demo:

**[Launch Energy Payback Calculator](https://jiexiaozhang1.github.io/energy-payback-calculator/)**

The static demo supports the complete input, local calculation, result, language, currency, and share-image experience. Because GitHub Pages cannot run Express, backend-only scenario saving is available when the project is run locally or deployed to a Node.js host.

For the complete frontend and backend experience:

```bash
npm install
npm run build
npm run start
```

Then open `http://localhost:8787`.

## Screenshots

### Input and tariff overview

![English input screen](docs/assets/screenshot-input-en.png)

### Tariff editor

![English tariff editor](docs/assets/screenshot-tariff-editor-en.png)

### Calculation result

![English result screen](docs/assets/screenshot-result-en.png)

### Desktop layout

![English desktop layout](docs/assets/screenshot-desktop-en.png)

See the [English screenshot index](docs/SCREENSHOTS.en.md) for a description of each view.

## What the Application Does

The application answers one practical question:

> If a household can move some electricity use into cheaper hours, how much money could it save each year, and how long might the required equipment take to pay back?

The demo models four categories of flexible household energy use:

1. **Home battery**: charge during cheaper periods and discharge during expensive periods.
2. **Heat pump or hot water load**: move part of the heating demand into cheaper periods, adjusted by the heat pump coefficient of performance.
3. **Electric vehicle charging**: schedule weekly charging demand during lower-price hours.
4. **Timer-based appliances**: move loads such as laundry or dishwashing away from peak periods.

This is a working application rather than a static mockup. It includes editable tariff periods, state persistence, local and server-side calculation, scenario saving, shared-scenario loading, PNG share-image generation, five interface languages, and multiple currency display options.

## Core User Flow

1. **Edit the electricity tariff.**
   Define periods such as 00:00-06:00 at a negative price, 06:00-17:00 at a low rate, and 17:00-24:00 at a high rate. The editor normalizes the input into a complete 24-hour schedule and merges adjacent periods with the same price.

2. **Choose flexible devices.**
   Enable only the device categories available in the household. Sliders control the relevant flexible energy amount, such as kWh per day or kWh per week.

3. **Enter the investment cost.**
   The default workflow uses a single total equipment cost. Advanced settings can optionally assign separate costs to enabled devices.

4. **Adjust technical assumptions.**
   Available parameters include battery round-trip efficiency, battery cycles per day, heat pump COP, and per-device cost allocation.

5. **Calculate.**
   The frontend first requests a result from the Express API. If the backend is unavailable, the same calculation model runs locally in the browser.

6. **Review and share.**
   The result screen presents estimated payback time, annual savings, device contributions, a simple daily energy plan, image sharing, and saved-scenario links when the backend is available.

For a step-by-step presentation, use the [English demo walkthrough](docs/DEMO.en.md).

## Example Default Estimate

Using the included example tariff and default enabled devices, the calculator produces an estimate close to the following values:

| Metric | Approximate value |
|---|---:|
| Annual savings | 11,173 |
| Investment cost | 30,000 |
| Payback time | 2.7 years |
| Home battery contribution | 5,148 per year |
| Heat pump or hot water contribution | 1,363 per year |
| EV charging contribution | 3,640 per year |
| Timer-based appliances contribution | 1,022 per year |

These values demonstrate the model and do not predict a specific household's actual bill. Currency switching changes number and symbol formatting only; it does not convert values using live exchange rates.

## Calculation Model

The calculation code is implemented in both locations:

- Frontend: `src/lib/calculations.ts`
- Backend: `server/calculations.js`

At a high level, the model:

1. Normalizes tariff blocks.
2. Expands the tariff into 24 hourly prices.
3. Identifies lower-price and higher-price windows.
4. Estimates the flexible energy amount for each enabled device.
5. Calculates the positive difference between cheap-use cost and avoided expensive-grid cost.
6. Adjusts the estimate for device-specific assumptions such as battery efficiency or heat pump COP.
7. Annualizes each device contribution.
8. Adds all contributions to obtain total annual savings.
9. Divides investment cost by annual savings to estimate payback years.

The model intentionally remains understandable. It does not simulate weather, an exact household load curve, solar export restrictions, battery degradation, device-level power limits, network charges, taxes, subsidies, or real-time market settlement.

Read the formulas, data shapes, API contracts, and deployment behavior in the [English technical overview](docs/TECHNICAL_OVERVIEW.en.md).

## Architecture

```text
energy-payback-calculator
├── src/
│   ├── App.tsx                   # React application and screen flow
│   ├── styles.css                # Mobile-first interface styling
│   └── lib/
│       ├── calculations.ts       # Browser calculation model
│       ├── tariffEditor.ts       # Tariff editing and normalization
│       ├── i18n.ts               # Interface translations
│       ├── defaults.ts           # Default state and options
│       ├── storage.ts            # LocalStorage persistence
│       ├── api.ts                # Express API client
│       ├── shareImage.ts         # Canvas-based PNG generation
│       └── types.ts              # Shared frontend types
├── server/
│   ├── index.js                  # Express API and static file serving
│   └── calculations.js           # Server calculation model
├── docs/
│   ├── assets/                   # English and Chinese screenshots
│   ├── DEMO.en.md                # English demo walkthrough
│   ├── PITCH.en.md               # English presentation scripts
│   ├── SCREENSHOTS.en.md         # English screenshot index
│   └── TECHNICAL_OVERVIEW.en.md  # English implementation notes
├── data/
│   └── .gitkeep                  # Runtime scenario JSON is ignored
└── package.json                  # Scripts, metadata, and dependencies
```

### Frontend

The frontend uses React, TypeScript, Vite, Framer Motion, and Lucide icons. It is responsible for:

- Rendering the mobile-first input and result screens.
- Editing and validating tariff periods.
- Managing device switches, sliders, cost fields, and advanced assumptions.
- Persisting calculator state in LocalStorage.
- Calling the backend when it is available.
- Falling back to browser-side calculation when the API is unavailable.
- Animating result values and sections.
- Generating a downloadable PNG share image with Canvas.
- Switching interface language and currency formatting.
- Loading a saved scenario from a URL query parameter.

### Backend

The backend is a small Express service with four endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/health` | Check service availability |
| `POST` | `/api/calculate` | Calculate savings from submitted state |
| `POST` | `/api/scenarios` | Save a state and result snapshot |
| `GET` | `/api/scenarios/:id` | Load a saved scenario |

Saved scenarios are written to `data/*.json`. These runtime files are ignored by Git and are not included in the public repository.

## Local Development

Requirements:

- Node.js 18 or newer
- npm

Install dependencies:

```bash
npm install
```

Run the frontend and backend development servers together:

```bash
npm run dev:full
```

Build and run the production version locally:

```bash
npm run build
npm run start
```

Open `http://localhost:8787`.

Build specifically for this repository's GitHub Pages subpath:

```bash
VITE_BASE_PATH=/energy-payback-calculator/ npm run build
```

## Verification

Run the automated test suite:

```bash
npm test
```

Build the production bundle:

```bash
npm run build
```

Optional dependency audit:

```bash
npm audit --omit=dev
```

The project was verified before publication with 7 passing test files, 34 passing tests, and a successful production build.

## Documentation

All project documentation is separated by language. No English and Chinese explanations are interleaved in the same document.

English documentation:

- [Project README](README.md)
- [Demo walkthrough](docs/DEMO.en.md)
- [Presentation scripts](docs/PITCH.en.md)
- [Technical overview](docs/TECHNICAL_OVERVIEW.en.md)
- [Screenshot index](docs/SCREENSHOTS.en.md)

Every document has a language link at the top that opens its complete Chinese counterpart.

## Limitations

This project is a demo-level estimator. It is useful for product demonstration, explanation, and rough comparison, but it should not be treated as engineering design advice, investment advice, or a guaranteed electricity-bill forecast.

Known limitations:

- No live tariff import.
- No live exchange-rate conversion.
- No detailed household load profile.
- No solar generation or export model.
- No battery degradation curve.
- No device-level charging or discharge power constraints.
- No tax, subsidy, network charge, or demand-charge model.
- No user authentication or hosted database.
- GitHub Pages cannot run the Express API or persist saved scenarios.

## Security

The application does not require API keys or private credentials. The repository ignores environment files, dependency folders, build output, local browser artifacts, generated scenario JSON, logs, and coverage reports.

Important ignored paths include:

- `.env` and `.env.*`
- `node_modules/`
- `dist/`
- `.playwright-cli/`
- `data/*.json`
- log files
- coverage output

Do not commit credentials or personal scenario data if the project is extended with external services.

## License

Released under the MIT License. See [LICENSE](LICENSE).
