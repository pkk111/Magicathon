# Spec 0: Project Scaffold

## Priority: P0 (MVP)

## Goal
Set up the monorepo with Vite, React, TypeScript, Tailwind, and Vercel serverless functions.

## Done When
- `npm run dev` starts Vite frontend on port 5173
- API functions work via Vercel dev or local Express wrapper
- Tailwind utility classes render correctly
- A landing page loads with "Magicathon" branding

## Structure
```
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css          # Tailwind base + custom vars
│   ├── components/
│   ├── templates/
│   ├── hooks/
│   ├── lib/             # db.ts, api.ts, image.ts, positions.ts
│   ├── context/         # MemeContext + EditorContext (useReducer)
│   └── pages/
├── api/
│   └── health.ts
├── shared/
│   └── types.ts
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── vercel.json
├── index.html
└── .gitignore
```

## Key Decisions
- Vite for fast HMR during build day
- Tailwind for rapid UI (no component library overhead)
- Vercel serverless for zero-config deployment + API
- React Router for `/m/:id` public view route
- Environment variables via `.env.local` (gitignored)

## Dependencies to Install
```
# Core
react react-dom react-router-dom

# Canvas
konva react-konva

# Animation
framer-motion

# Utilities
nanoid

# Vercel services
@vercel/blob @vercel/postgres

# Dev
vite @vitejs/plugin-react typescript @types/react @types/react-dom
tailwindcss postcss autoprefixer
openai
```

Notes:
- OpenRouter uses the OpenAI-compatible SDK (`openai` package) with a custom base URL.
- State managed via React hooks (useContext + useReducer) — no external state library.
- Everything on Vercel: Postgres, Blob, serverless, hosting. No Firebase.

## Verification
1. Run `npm run dev` → browser opens, page renders with Tailwind styles
2. Hit `GET /api/health` → returns `{ status: "ok" }`
