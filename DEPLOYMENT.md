# Deployment Guide - Railway

## Prerequisites
- GitHub account with this repository pushed
- Railway account (https://railway.app)

## Step-by-Step Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy on Railway

#### Option A: Using Railway Dashboard

1. **Go to** https://railway.app and sign in
2. **Click** "Create New Project"
3. **Select** "Deploy from GitHub"
4. **Authorize** Railway to access your GitHub account
5. **Select** the `trading-coach-app` repository
6. **Select** the `main` branch
7. **Click** "Deploy"

Railway will automatically:
- Detect Node.js project
- Install dependencies (`npm install`)
- Run start script: `npm run start`
- Assign a public URL

#### Option B: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Connect to your project (or create new)
railway init

# Deploy
railway up
```

### 3. Configure Environment Variables

After deployment:

1. **Go to** Railway Dashboard → Your Project
2. **Click** "Variables" tab
3. **Add** these variables:
   - `PORT` = (Railway auto-assigns, or leave empty)
   - `WEBHOOK_SECRET` = `trading-coach-secret-2026` (change this in production)

4. **Click** "Deploy" to apply changes

### 4. Get Your Webhook URL

1. **Go to** Railway Dashboard → Your Project
2. **Click** "Deployments" tab
3. **Find** the public URL (e.g., `https://trading-coach-app-production.up.railway.app`)
4. **Your webhook URL is:**
   ```
   https://trading-coach-app-production.up.railway.app/api/alerts
   ```

### 5. Test the Deployment

```bash
# Health check
curl https://your-deployment-url.app/api/health

# Send a test alert (replace URL and token)
curl -X POST https://your-deployment-url.app/api/alerts \
  -H "Authorization: Bearer trading-coach-secret-2026" \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","bias":"buy","confidence":85,"risk":"Low","message":"Test alert"}'
```

### 6. Configure TradingView Webhook

1. **Go to** TradingView Alert Creation
2. **Set webhook URL to:**
   ```
   https://your-deployment-url.app/api/alerts
   ```
3. **Set alert message:**
   ```json
   {"ticker":"{{ticker}}","bias":"{{strategy.order.action}}","confidence":85,"risk":"Low","message":"{{strategy.order.comment}}"}
   ```
4. **Important:** TradingView webhooks require custom header support. If not available:
   - Use Railway's "Webhook Route" feature
   - Or pass token in query parameter: `?token=trading-coach-secret-2026`

### 7. Verify Alerts Are Saved

```bash
# Get latest alert
curl https://your-deployment-url.app/api/alerts/latest

# Get all alerts
curl https://your-deployment-url.app/api/alerts?limit=10
```

## Important Notes

### Data Persistence
- Alerts stored in `alerts.json` in Railway's ephemeral filesystem
- Persists during normal operation
- Resets when app restarts (Railway may restart periodically)
- **For production:** Consider database integration (PostgreSQL, MongoDB)

### Security
- **Change `WEBHOOK_SECRET`** in production (in Railway Variables)
- **Never commit secrets** to GitHub
- GET endpoints are public (by design - dashboard needs access)
- Only POST endpoint requires authorization

### Cost
- Railway free tier includes:
  - 5GB storage
  - 100 GB-hours of compute per month
  - This app uses minimal resources

### Monitoring
- Railway Dashboard shows:
  - Deployment status
  - Network logs
  - Resource usage
  - Deployments history

## Troubleshooting

### Build fails
- Check Node.js version: `node --version`
- Verify `package.json` has correct `start` script
- Check Railway logs: Dashboard → Deployment → Logs

### Cannot connect to webhook
- Verify public URL is correct
- Check Authorization header is included
- Verify token matches `WEBHOOK_SECRET`
- Check Railway deployment status is "success"

### Alerts not saving
- Check Railway logs for file write errors
- Verify app has write permissions
- Consider switching to database backend

## Next Steps

For production use, consider:
1. **Database:** PostgreSQL instead of JSON file
2. **Authentication:** Replace Bearer token with OAuth/API keys
3. **Rate Limiting:** Add protection against abuse
4. **Monitoring:** Set up error tracking (Sentry, etc.)
5. **Backup:** Regular database backups
