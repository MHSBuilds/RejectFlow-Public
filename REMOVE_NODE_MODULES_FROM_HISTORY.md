# Commands to Remove node_modules from Git History

Run these commands **in order** in your PowerShell window where Git is working:

## Step 1: Verify Current State

```powershell
# Check commit history
git log --oneline --all

# Check current status
git status

# Verify .gitignore includes node_modules
cat .gitignore | Select-String "node_modules"
```

## Step 2: Remove node_modules from Entire History

**IMPORTANT**: This will rewrite your Git history. Make sure you're ready to proceed.

```powershell
# Remove node_modules from all commits in history
git filter-branch --force --index-filter "git rm -rf --cached --ignore-unmatch node_modules" --prune-empty --tag-name-filter cat -- --all
```

This command:
- Removes `node_modules` from every commit
- Removes empty commits that result from this
- Applies to all branches and tags

**Note**: This may take several minutes depending on repository size.

## Step 3: Clean Up Backup References

```powershell
# Remove backup references created by filter-branch
Remove-Item -Recurse -Force .git/refs/original/

# Force garbage collection to clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

## Step 4: Verify History is Clean

```powershell
# Check that node_modules doesn't appear in any commit
git log --all --full-history -- node_modules

# This should return nothing (no commits found)
# If it shows commits, node_modules still exists in history

# Verify repository size (should be much smaller)
git count-objects -vH
```

## Step 5: Force Push to GitHub

**WARNING**: This will overwrite the remote repository. Since this is a new repo with no collaborators, this is safe.

```powershell
# Force push the cleaned history
git push origin main --force
```

If you get an error about the branch name, try:
```powershell
git push origin main --force --set-upstream
```

## Step 6: Verify on GitHub

1. Go to your GitHub repository: https://github.com/MHSBuilds/RejectFlow
2. Check that:
   - `node_modules` folder is NOT visible
   - All your source files are present
   - Repository size is reasonable (not 100+ MB)

## Alternative: If filter-branch doesn't work

If `git filter-branch` gives errors, you can use the newer `git filter-repo` tool (requires installation):

```powershell
# Install git-filter-repo (if needed)
# pip install git-filter-repo

# Remove node_modules from history
git filter-repo --path node_modules --invert-paths
```

## Troubleshooting

### If you get "fatal: bad revision" errors:
- Make sure you're in the repository root directory
- Try: `git filter-branch --force --index-filter "git rm -rf --cached --ignore-unmatch node_modules" --prune-empty -- --all`

### If push is rejected:
- Make sure you have write access to the repository
- Try: `git push origin main --force-with-lease` (safer force push)

### If repository is still too large:
- Check for other large files: `git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | Where-Object { $_ -match '^blob' } | ForEach-Object { $_.Split(' ') } | Where-Object { [int]$_ -gt 1000000 } | Sort-Object -Descending

## Expected Results

After completing these steps:
- ✅ `node_modules` completely removed from Git history
- ✅ Repository size significantly reduced
- ✅ Push to GitHub succeeds
- ✅ All source files preserved
- ✅ `.gitignore` properly configured

