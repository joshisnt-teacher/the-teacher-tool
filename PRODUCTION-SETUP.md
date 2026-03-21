# Production Environment Setup

## Your Supabase Project Details

**Project ID**: `aogorchudxilnkhtfvqq`  
**Project URL**: `https://aogorchudxilnkhtfvqq.supabase.co`

## Step-by-Step Production Setup

### 1. Get Your Anon Key from Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com/project/aogorchudxilnkhtfvqq)
2. Navigate to **Settings** → **API**
3. Copy the **anon/public** key (NOT the service_role key)

### 2. Set Environment Variables in Your Hosting Platform

#### For Netlify:
1. Go to your site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add these variables:
   ```
   VITE_SUPABASE_URL = https://aogorchudxilnkhtfvqq.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ29yY2h1ZHhpbG5raHRmdnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTMzMTcsImV4cCI6MjA3Mjk4OTMxN30.0vp_AEwqrpyG7iVwziDPnFiSw_fqDhmaJQLA7GFmwn4
   ```

#### For Vercel:
1. Go to your project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the same variables as above

#### For Other Platforms:
Set these environment variables in your deployment platform:
- `VITE_SUPABASE_URL=https://aogorchudxilnkhtfvqq.supabase.co`
- `VITE_SUPABASE_ANON_KEY=[your-anon-key]`

### 3. For Node.js Scripts (Optional)
If you want your utility scripts to work with production, also set:
- `SUPABASE_URL=https://aogorchudxilnkhtfvqq.supabase.co`
- `SUPABASE_ANON_KEY=[your-anon-key]`

## Verification

After deployment, your app will:
- ✅ Use local database (`http://127.0.0.1:54321`) during development
- ✅ Use production database (`https://aogorchudxilnkhtfvqq.supabase.co`) when deployed

## Security Notes

- ✅ Your database password (`T3acherT00l!123`) is only used for direct database access, not in the app
- ✅ The anon key is safe to use in frontend applications
- ✅ Never commit the anon key to your repository - only set it as environment variables

## Quick Test

To verify your production setup works:
1. Deploy with the environment variables set
2. Check browser developer tools → Network tab
3. Look for API calls going to `https://aogorchudxilnkhtfvqq.supabase.co` instead of `127.0.0.1`
