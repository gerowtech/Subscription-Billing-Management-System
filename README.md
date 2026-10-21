

## Local development API connection

The frontend expects the API at `http://localhost:4001/api` by default. The backend health endpoint is `http://localhost:4001/api/health`.

1. Copy `.env.example` to `.env` in the project root if `.env` does not already exist.
2. In the root `.env`, set `PORT=4001` and `FRONTEND_URL=http://localhost:5173`. An existing `.env` takes precedence over `.env.example`; editing the example file alone does not change your active settings.
3. Run `npm run install:all`, then `npm run dev` from the project root.
4. Visit `http://localhost:4001/api/health`; it should return JSON with `ok: true`. The `database` field may say `disconnected` if MongoDB is not available, but the API health route should still respond.

If port 4001 is already occupied, stop the process using it or choose another free port and update the frontend `VITE_API_URL` consistently.

