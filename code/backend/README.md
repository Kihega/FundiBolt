# FundiBolt Backend

Express + TypeScript API, using Supabase (Postgres) and Upstash (Redis).

## Setup

    cd code/backend
    npm install
    cp .env.example .env   # then fill in real values (already done for local dev)
    npm run dev

## Health check

Once running, visit `http://localhost:4000/health` to confirm both the
database and Redis connections are working.

## Notes

- `DATABASE_URL` uses the Supabase **transaction pooler** (port 6543) for
  normal app queries — recommended for serverless/short-lived connections.
- `DATABASE_URL_DIRECT` (port 5432) is reserved for migrations or admin
  tasks only, not regular app traffic.
- `.env` is gitignored — never commit real credentials.


## Deployment (Render, via Docker)

Local development does **not** use Docker - keep using `npm run dev` as usual.
Docker is only for the Render deployment:

1. In Render, create a new **Web Service** from this GitHub repo.
2. Set **Root Directory** to `code/backend`.
3. Render will auto-detect the `Dockerfile` and use it as the build/runtime.
4. Add every variable from your local `.env` to Render's **Environment**
   dashboard manually (Render never reads your local `.env` file):
   - `DATABASE_URL`
   - `DATABASE_URL_DIRECT`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `JWT_SECRET` (use a different one than local dev)
   - `RESEND_API_KEY` (once you have one)
   - `EMAIL_FROM`
   - `NODE_ENV=production` (this also disables the dev OTP bypass code)
5. Deploy. Render will build the Docker image and run `node dist/index.js`.

To test the exact Docker image locally before deploying:

    cd code/backend
    docker build -t fundibolt-backend .
    docker run --env-file .env -p 4000:4000 fundibolt-backend
