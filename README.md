# SkillPath Course Section

A React + TypeScript course section component that fetches country and course data from two APIs, retries failed requests, and renders localized course pricing.

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview the production build locally:

```bash
npm run preview
```

## Notes

- The app reads data from:
  - country endpoint: `/assignment/country-code`
  - course endpoint: `/assignment/course-data`
- The fetch layer includes retry logic (up to 3 attempts per endpoint).
