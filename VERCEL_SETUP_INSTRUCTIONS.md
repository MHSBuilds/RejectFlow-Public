# Vercel Auto-Deployment Setup Instructions

## Prerequisites
- ✅ GitHub repository created and code pushed (complete Git setup first)
- ✅ Vercel account ready

## Step 1: Connect Vercel to GitHub

1. Go to https://vercel.com/login
2. Sign in with your GitHub account (or create a Vercel account)
3. Click **"Add New Project"** or go to https://vercel.com/new
4. Click **"Import Git Repository"**
5. Select your GitHub account if prompted
6. Find and select your `recruitment-assistant` repository
7. Click **"Import"**

## Step 2: Configure Project Settings

Vercel will auto-detect Next.js, but verify these settings:

- **Framework Preset**: Next.js (should be auto-detected)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default, Next.js handles this)
- **Install Command**: `npm install` (default)

## Step 3: Configure Environment Variables

**CRITICAL**: Add all required environment variables before deploying:

1. In the project setup page, scroll to **"Environment Variables"**
2. Add each variable one by one:

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
```
- Value: Your Supabase project URL
- Environment: Production, Preview, Development (select all)

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
- Value: Your Supabase anonymous key
- Environment: Production, Preview, Development (select all)

```
SUPABASE_SERVICE_ROLE_KEY
```
- Value: Your Supabase service role key
- Environment: Production, Preview, Development (select all)
- ⚠️ **Mark as sensitive/secret**

```
OPENAI_API_KEY
```
- Value: Your OpenAI API key
- Environment: Production, Preview, Development (select all)
- ⚠️ **Mark as sensitive/secret**

```
RESEND_API_KEY
```
- Value: Your Resend API key
- Environment: Production, Preview, Development (select all)
- ⚠️ **Mark as sensitive/secret**

### NextAuth Variables (if using NextAuth)

```
NEXTAUTH_URL
```
- Value: Your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
- Environment: Production only
- Note: You can update this after first deployment with the actual URL

```
NEXTAUTH_SECRET
```
- Value: Generate a random secret (you can use: `openssl rand -base64 32`)
- Environment: Production, Preview, Development (select all)
- ⚠️ **Mark as sensitive/secret**

### How to Add Variables

1. Click **"Add"** or **"Add Environment Variable"**
2. Enter the variable name
3. Enter the variable value
4. Select environments (Production, Preview, Development)
5. Click **"Save"**
6. Repeat for each variable

## Step 4: Deploy

1. After adding all environment variables, click **"Deploy"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Vercel will show you the deployment URL (e.g., `https://recruitment-assistant.vercel.app`)

## Step 5: Verify Deployment

1. Visit your deployment URL
2. Test the application:
   - [ ] Homepage loads
   - [ ] Login/signup works
   - [ ] API routes function correctly
   - [ ] Database connections work

## Step 6: Enable Auto-Deployment

Auto-deployment is enabled by default, but verify:

1. Go to your project settings: **Settings** → **Git**
2. Verify **"Production Branch"** is set to `main` (or `master`)
3. Verify **"Automatic deployments from Git"** is enabled
4. Verify **"Preview deployments for Pull Requests"** is enabled (optional but recommended)

### Auto-Deployment Behavior

- **Production**: Every push to `main` branch triggers a new production deployment
- **Preview**: Every pull request gets a preview deployment URL
- **Manual**: You can also trigger deployments manually from the Vercel dashboard

## Step 7: Update NEXTAUTH_URL (if applicable)

After your first deployment:

1. Copy your production URL from Vercel (e.g., `https://your-project.vercel.app`)
2. Go to **Settings** → **Environment Variables**
3. Update `NEXTAUTH_URL` with your actual production URL
4. Redeploy (or wait for next auto-deployment)

## Step 8: Custom Domain (Optional)

If you want to use a custom domain:

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (can take up to 48 hours)

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing environment variables
   - TypeScript errors
   - Missing dependencies
   - Build timeout (increase in settings if needed)

### Environment Variables Not Working

1. Verify variables are added for the correct environment (Production/Preview/Development)
2. Check variable names match exactly (case-sensitive)
3. Redeploy after adding new variables

### Database Connection Issues

1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Verify RLS policies allow connections from Vercel IPs (if applicable)

## Success Checklist

- [ ] Repository connected to Vercel
- [ ] All environment variables configured
- [ ] Initial deployment successful
- [ ] Application accessible via Vercel URL
- [ ] Auto-deployment enabled
- [ ] Tested key functionality (login, API routes, database)

## Next Steps

After successful deployment:

1. Monitor deployments in Vercel dashboard
2. Set up error tracking (optional, e.g., Sentry)
3. Configure analytics (Vercel Analytics is already included via `@vercel/speed-insights`)
4. Set up monitoring and alerts

## Deployment Workflow

Going forward, your workflow will be:

1. Make code changes locally
2. Test locally with `npm run dev`
3. Commit changes: `git add . && git commit -m "Description"`
4. Push to GitHub: `git push origin main`
5. Vercel automatically detects the push
6. Vercel builds and deploys automatically
7. Get notified of deployment status (via email or dashboard)

---

**Note**: Keep your `.env.local` file local and never commit it. All production secrets should only be in Vercel's environment variables.

