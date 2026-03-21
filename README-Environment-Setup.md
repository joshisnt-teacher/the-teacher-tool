# Environment Configuration Guide

This project uses environment variables to manage database connections for different environments (local development vs production).

## Quick Setup

### For Local Development (Default)
No setup required! The app will automatically use your local Supabase instance at `http://127.0.0.1:54321`.

### For Production Deployment

1. **Get your Supabase credentials:**
   - Go to [Supabase Dashboard](https://app.supabase.com/project/aogorchudxilnkhtfvqq)
   - Go to Settings → API
   - Copy your anon/public key

2. **Set environment variables in your hosting platform:**
   ```bash
   VITE_SUPABASE_URL=https://aogorchudxilnkhtfvqq.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTMzMTcsImV4cCI6MjA3Mjk4OTMxN30.0vp_AEwqrpyG7iVwziDPnFiSw_fqDhmaJQLA7GFmwn4
   ```

## Environment Variable Reference

| Variable | Description | Local Default | Production |
|----------|-------------|---------------|------------|
| `VITE_SUPABASE_URL` | Supabase project URL | `http://127.0.0.1:54321` | Your project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Local dev key | Your project key |

## Platform-Specific Setup

### Netlify
Add environment variables in: Site settings → Environment variables

### Vercel
Add environment variables in: Project settings → Environment Variables

### GitHub Actions
Add as repository secrets: Settings → Secrets and variables → Actions

## Utility Scripts

For Node.js utility scripts, use these environment variables (without `VITE_` prefix):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## How It Works

The app uses fallback values:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
```

This means:
- ✅ Local development works out of the box
- ✅ Production uses your environment variables
- ✅ No code changes needed when deploying
