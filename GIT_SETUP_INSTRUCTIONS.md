# Git and GitHub Setup Instructions

## Step 1: Install Git

Since Git is not currently installed on your system, you need to install it first:

### Option A: Install Git for Windows (Recommended)
1. Download Git from: https://git-scm.com/download/win
2. Run the installer with default settings
3. Restart your terminal/PowerShell after installation
4. Verify installation by running: `git --version`

### Option B: Install via Winget (if available)
```powershell
winget install --id Git.Git -e --source winget
```

### Option C: Use GitHub Desktop
1. Download from: https://desktop.github.com/
2. Install and sign in with your GitHub account
3. Use the GUI to initialize and push the repository

## Step 2: Configure Git (First Time Setup)

After installing Git, configure your user information:

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 3: Initialize Repository

Once Git is installed, run these commands in your project directory:

```powershell
# Initialize the repository
git init

# Add all files (excluding .gitignore items)
git add .

# Create initial commit
git commit -m "Initial commit: Recruitment Rejection Assistant"

# Verify files are staged correctly (should NOT include .env.local, node_modules, etc.)
git status
```

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `recruitment-assistant` (or your preferred name)
3. Description: "AI-powered recruitment rejection email assistant"
4. Set to **Private** (recommended for projects with API keys)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 5: Connect and Push to GitHub

After creating the repository, GitHub will show you commands. Use these:

```powershell
# Add GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Verification

After pushing, verify:
- [ ] All files are on GitHub (check the repository page)
- [ ] `.env.local` is NOT in the repository
- [ ] `node_modules/` is NOT in the repository
- [ ] `client_secret_*.json` files are NOT in the repository

## Next Steps

After completing Git setup, proceed to Vercel configuration (see VERCEL_SETUP_INSTRUCTIONS.md)

