# Brisbane Water Bill Explainer

Unofficial residential water/sewer bill calculator for **Brisbane, California**. Enter meter size, usage, winter sewer average, capital, and drought inputs to see the same line items as a City bill (WATER USE, WATER SERVICE, SEWER, CAPITAL PROJECT CHRG, DROUGHT CONTINGENCY, TOTAL), plus a comparison across approved rate years through 2027.

This is **not** an official City tool. Rates come from published tables and the Prop 218 notice (Resolution 2023-17 maxima). LIRA is omitted.

**Live:** [https://brisbane-water-explainer.vercel.app](https://brisbane-water-explainer.vercel.app)  
**Repo:** [https://github.com/anfernizzle/brisbane-water-explainer](https://github.com/anfernizzle/brisbane-water-explainer)

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Tests

Regression fixtures from real residential bills (account `002-1220-002`):

```bash
npm test
```

The June 2026 21-ccf fixture does **not** assert the billed over-20 increment ($13.47 = 2024 tier-2). The calculator uses the Prop 218 / published 2025 maximum ($14.34). Other fixtures must match to the penny.

## Deploy to Vercel

1. Push this repo to GitHub (or connect the local folder in the Vercel CLI).
2. Import the project in [Vercel](https://vercel.com/new) — framework preset **Next.js**.
3. Deploy. No environment variables required (client-side rates only).

Or with the CLI:

```bash
npx vercel
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Rates live in `src/lib/rates.ts`
- Bill math in `src/lib/calculate.ts`
- Fixture regression tests in `src/lib/calculate.test.ts`

## Sources

- [Capital Projects Charge](https://www.brisbaneca.gov/513/Capital-Projects-Charge) (official)
- [Drought Contingency Charge](https://www.brisbaneca.gov/512/Drought-Contingency-Charge) (official)
- [Residential water rates](https://www.brisbaneca.gov/514/Water-Rate-Table---Residential)
- [Sewer rates](https://www.brisbaneca.gov/517/Sewer-Rate-Table---Residential-Commercia)
- [Prop 218 notice (2023–2027)](https://www.brisbaneca.gov/DocumentCenter/View/1573)
