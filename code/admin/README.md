# FundiBolt Admin Dashboard

Not yet scaffolded. This will be a Next.js app deployed on Vercel.

## To scaffold (run once, from code/web):

    cd code/web
    npx create-next-app@latest . --typescript

When prompted, recommended choices:
  - ESLint: Yes
  - Tailwind CSS: Yes
  - App Router: Yes
  - src/ directory: Yes

## After scaffolding

    cp .env.example .env.local
    npm run dev

Then connect this folder to Vercel (import the GitHub repo, set the
root directory to `code/web` in Vercel project settings).
