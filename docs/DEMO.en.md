<p align="right">
  <strong>English</strong> · <a href="./DEMO.zh-CN.md">简体中文</a>
</p>

# Demo Walkthrough

This guide explains how to present the Energy Payback Calculator in a live demo, class presentation, portfolio review, interview, or GitHub project showcase. The complete walkthrough takes about five to eight minutes; shorter presentations can use only the introduction, tariff editor, result screen, and closing summary.

## 1. One-Sentence Introduction

> This demo estimates how much a household may save by moving flexible electricity use into cheaper tariff periods, and how many years it may take for the equipment investment to pay back.

## 2. Explain the Problem

Many electricity plans no longer charge one flat rate throughout the day. Electricity may be inexpensive overnight, moderately priced during the day, and expensive during the evening peak. Some markets can even have negative prices for a few hours.

For a household with a battery, heat pump, electric vehicle, or timer-based appliances, this creates an opportunity. Part of the household's electricity use can be moved into cheaper periods. The calculator turns that price difference into a rough estimate of annual savings and equipment payback.

Suggested explanation:

> The application is built around flexible electricity use. It does not assume every household load can move. It estimates only the selected devices and shows how much each one contributes to the result.

## 3. Open the Application

For the public static demo, open:

```text
https://jiexiaozhang1.github.io/energy-payback-calculator/
```

For a complete local production demo with the Express backend:

```bash
npm install
npm run build
npm run start
```

Then open:

```text
http://localhost:8787
```

For development with both servers:

```bash
npm run dev:full
```

The GitHub Pages version uses browser-side calculation because static hosting cannot run Express. Scenario saving and shared-scenario restoration require the backend.

## 4. Present the Input Screen

![English input screen](assets/screenshot-input-en.png)

Point out these areas:

1. Language and currency controls at the top.
2. The mobile-first application layout.
3. The 24-hour tariff timeline.
4. Four flexible device categories.
5. The total equipment cost field.
6. The expandable advanced settings.
7. The main calculation action at the bottom.

Suggested explanation:

> The first screen is intentionally direct. The user does not need to build a detailed energy model. They enter the tariff, choose the devices that can shift electricity use, enter the investment cost, and calculate.

## 5. Edit the Tariff

![English tariff editor](assets/screenshot-tariff-editor-en.png)

Demonstrate the following interaction:

1. Select a block on the tariff timeline.
2. Show the editor opening from the bottom of the screen.
3. Change the start hour, end hour, or price per kWh.
4. Point out that negative prices are accepted.
5. Add a new period or remove an existing period.
6. Save the change and return to the 24-hour timeline.

Important behavior to explain:

- The schedule always covers 00:00 to 24:00.
- Each period covers at least one hour.
- Overlapping or missing ranges are resolved through hourly normalization.
- Adjacent periods with the same price are merged.

Suggested explanation:

> The tariff editor is more than a collection of form fields. It converts every edit into a clean 24-hour price schedule because the savings calculation works from hourly prices.

## 6. Select Flexible Devices

The calculator supports four categories:

1. Home battery.
2. Heat pump or hot water load.
3. Electric vehicle charging.
4. Timer-based appliances.

Each category can be enabled or disabled independently. When a category is enabled, the user can change the relevant capacity or flexible energy amount with a slider.

Suggested explanation:

> A household should enable only the equipment it actually has. The calculation then attributes annual savings separately, so the result shows which categories have the largest effect.

## 7. Show Cost and Advanced Assumptions

The standard workflow uses one total investment cost. The advanced area exposes additional assumptions:

1. Battery round-trip efficiency.
2. Battery cycles per day.
3. Heat pump coefficient of performance.
4. Optional cost allocation by enabled device.

Suggested explanation:

> The default interface stays simple, while the advanced section gives more control to users who understand equipment efficiency and cost assumptions.

## 8. Calculate and Present the Result

![English result screen](assets/screenshot-result-en.png)

After selecting the example settings, press **Calculate payback**. Present the result from top to bottom:

1. Estimated payback time.
2. Estimated annual savings.
3. Whether the result came from the backend or local fallback.
4. Annual savings contributed by each device category.
5. Suggested cheap and expensive daily periods.
6. Share-image action.
7. Edit-inputs action.

Suggested explanation:

> The top of the result answers the main question immediately: how long the investment may take to pay back. The breakdown below explains where the savings come from, and the daily plan turns the result into an understandable operating suggestion.

Do not present the output as a guaranteed financial return. It is an estimate based on the tariff, flexible energy, cost, and efficiency assumptions entered by the user.

## 9. Explain Frontend and Backend Behavior

For a technical audience, show this sequence:

1. The frontend sends the current calculator state to `POST /api/calculate`.
2. The backend calculates and returns a result.
3. If the API is unavailable, the frontend runs `calculateSavings(state)` locally.
4. The result screen works in either case.
5. Saving a scenario sends the state and result to `POST /api/scenarios`.
6. The backend writes a generated JSON file under `data/`.
7. A URL containing `?scenario=<id>` can reload the saved state and result.

Suggested explanation:

> The backend is intentionally small. It demonstrates API-backed calculation and supports saved scenarios. The browser fallback keeps the core calculator usable on static hosting and during temporary API failure.

## 10. Demonstrate Language and Currency Controls

Switch the interface between English and Chinese to show that application text is translated in place. Other included interface languages are German, French, and Italian.

Switch the currency display to explain that symbols and number formatting change, but the application does not perform a live exchange-rate conversion. The numeric assumptions remain the values entered by the user.

## 11. Demonstrate Sharing

Use the share action on the result screen:

1. The app tries to save the current scenario when the backend is available.
2. It prepares a scenario URL.
3. It copies the link when the Clipboard API is available.
4. It creates a PNG result image with the Canvas API.
5. If scenario saving fails, image generation can still continue.

This is useful for showing that the project includes a complete result workflow rather than ending at a calculation number.

## 12. Closing Summary

> Energy Payback Calculator turns a practical time-of-use pricing question into an interactive web application. It combines editable 24-hour tariffs, flexible device assumptions, annual savings and payback estimates, a mobile-first interface, local fallback calculation, a small Express API, saved scenarios, share images, tests, and separate English and Chinese documentation.

For a ready-to-read talk, continue with the [English presentation scripts](PITCH.en.md). For implementation details, see the [English technical overview](TECHNICAL_OVERVIEW.en.md).
