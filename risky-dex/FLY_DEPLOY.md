# Fly.io Database Setup for RISKY-DEX
# Run these commands after installing flyctl

# 1. Install flyctl (if not installed)
# Windows: iwr https://fly.io/install.ps1 -useb | iex
# Mac/Linux: curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Create app (first time only)
flyctl launch --name risky-dex-backend --region iad --no-deploy

# 4. Create Postgres database (choose one):

# Option A: Fly Postgres (managed, paid after trial)
flyctl postgres create --name risky-dex-db --region iad --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 3

# Option B: External Database (Neon/Supabase - free tier)
# Create at neon.tech or supabase.com, then:
# flyctl secrets set DATABASE_URL="postgresql://..."

# 5. Set secrets (required)
flyctl secrets set \
  NODE_ENV=production \
  PORT=3001 \
  FRONTEND_URL=https://your-app.vercel.app \
  JWT_SECRET=$(openssl rand -base64 64) \
  JWT_REFRESH_SECRET=$(openssl rand -base64 64) \
  ENCRYPTION_KEY=$(openssl rand -base64 32 | cut -c1-32) \
  RATE_LIMIT_WINDOW_MS=900000 \
  RATE_LIMIT_MAX_REQUESTS=200

# Optional: Exchange API keys (for market data)
# flyctl secrets set BINANCE_API_KEY=... BINANCE_API_SECRET=...

# 6. Attach database (if using Fly Postgres)
flyctl postgres attach risky-dex-db --app risky-dex-backend

# 7. Deploy
flyctl deploy

# 8. Check logs
flyctl logs --app risky-dex-backend

# 9. Open app
flyctl open --app risky-dex-backend

# Useful commands:
# flyctl status --app risky-dex-backend
# flyctl ssh console --app risky-dex-backend
# flyctl logs --app risky-dex-backend
# flyctl scale count 1 --app risky-dex-backend