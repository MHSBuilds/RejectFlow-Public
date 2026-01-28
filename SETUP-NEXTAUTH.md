# NextAuth.js Setup Instructions

## ✅ Completed Steps

1. ✅ NextAuth.js installed
2. ✅ NextAuth configuration created at `src/app/api/auth/[...nextauth]/route.ts`
3. ✅ Type definitions created at `src/types/next-auth.d.ts`
4. ✅ Database migration script created at `create-users-table.sql`

## 📝 Manual Steps Required

### 1. Create `.env.local` file

Since `.env.local` is protected, please create it manually in your project root with:

```env
# Google OAuth (for NextAuth.js)
GOOGLE_CLIENT_ID=Your_Client_ID
GOOGLE_CLIENT_SECRET=Your_Client_Secret

# NextAuth.js
NEXTAUTH_URL=Your_NextAuth_URL
NEXTAUTH_SECRET=Your_NextAuth_Secret
```

### 2. Run Database Migration

Execute `create-users-table.sql` in your Supabase SQL Editor to create the `users` table.

### 3. Add Environment Variables to Vercel

Add the same environment variables to Vercel:
- Go to: https://vercel.com/automate-edges-projects/rejectflow/settings/environment-variables
- Add all 4 variables (use `https://rejectflow.app` for `NEXTAUTH_URL` in production)

### 4. Update Google OAuth Redirect URIs

Make sure these redirect URIs are added in Google Cloud Console:
- `https://rejectflow.app/api/auth/callback/google`
- `https://www.rejectflow.app/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/google`

### 5. Add Authorized JavaScript Origins

In Google Cloud Console, add:
- `https://rejectflow.app`
- `https://www.rejectflow.app`
- `http://localhost:3000`

## 🔄 Next Steps

After completing the manual steps above, proceed with:
- Step 4: Update auth utilities (`src/lib/auth.ts`)
- Step 5: Update AuthProvider (`src/app/components/AuthProvider.tsx`)
- Step 6: Update root layout (`src/app/layout.tsx`)
- Step 7: Update API routes to use NextAuth
- Step 8: Update login page

## ⚠️ Important Notes

- The `users` table must exist before NextAuth can work
- Keep your `.env.local` file secure and never commit it

