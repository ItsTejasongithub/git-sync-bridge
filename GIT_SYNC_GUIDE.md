# 🔄 Git Sync Guide - Bull Run Game

Easy one-click synchronization between your local machine and remote server.

---

## 📋 Quick Start

### **Local Machine (Development)**
Double-click: `PUSH_TO_GITHUB.bat`
- Automatically commits and pushes all changes to GitHub
- Prompts for commit message (or auto-generates one)
- Shows status and confirms success

### **Remote Server (Production)**
Double-click: `SYNC_FROM_GITHUB.bat`
- Automatically pulls latest changes from GitHub
- Updates dependencies (npm install)
- Ready to run immediately

---

## 🚀 First Time Setup

### **On Local Machine:**

1. **Double-click** `PUSH_TO_GITHUB.bat`
   - First run will initialize Git repository
   - Will prompt for GitHub credentials
   - Use **Personal Access Token** instead of password

2. **Get GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (all)
   - Copy the token
   - Use this token as your password when prompted

3. **Push your code:**
   - Enter commit message when prompted
   - Or press Enter for automatic message
   - Code will be pushed to: https://github.com/ItsTejasongithub/git-sync-bridge

### **On Remote Server:**

**Option 1: With Git (Requires Authentication)**
1. **Download** `SYNC_FROM_GITHUB.bat` from GitHub
2. **Double-click** `SYNC_FROM_GITHUB.bat`
   - First run will clone the entire repository
   - Automatically installs dependencies
   - Ready to use!

**Option 2: Without Git (No Authentication Required) - RECOMMENDED**
1. **Download** `SYNC_FROM_GITHUB_NO_AUTH.bat` from GitHub
2. **Double-click** `SYNC_FROM_GITHUB_NO_AUTH.bat`
   - Downloads latest code as ZIP file
   - No Git or authentication needed
   - Automatically extracts and installs dependencies
   - Ready to use!

---

## 📖 Detailed Usage

### **PUSH_TO_GITHUB.bat** (Local Machine)

**What it does:**
1. ✓ Checks Git installation
2. ✓ Shows current file changes
3. ✓ Asks for commit message
4. ✓ Stages all files
5. ✓ Creates commit
6. ✓ Pushes to GitHub

**Example Usage:**
```
Run the batch file
→ Shows changed files
→ Enter message: "Fixed scrolling in Solo mode"
→ Automatically commits and pushes
→ Shows success message
```

**Features:**
- Auto-generates commit message with timestamp if you don't provide one
- Shows what files changed before committing
- Handles both `master` and `main` branches automatically
- Color-coded output for easy reading

### **SYNC_FROM_GITHUB.bat** (Remote Server - Requires Git)

**What it does:**
1. ✓ Checks Git installation
2. ✓ Shows current status
3. ✓ Stashes local changes (if any)
4. ✓ Pulls latest code from GitHub
5. ✓ Installs BackEND dependencies
6. ✓ Installs FrontEND dependencies

### **SYNC_FROM_GITHUB_NO_AUTH.bat** (Remote Server - No Auth Required)

**What it does:**
1. ✓ Downloads latest code as ZIP from GitHub
2. ✓ Extracts files automatically
3. ✓ Updates code while preserving local changes
4. ✓ Installs BackEND dependencies
5. ✓ Installs FrontEND dependencies
6. ✓ No Git or authentication needed!

**Example Usage:**
```
Run the batch file
→ Automatically pulls latest changes
→ Installs dependencies
→ Shows success message
→ Ready to run START_GAME.bat
```

**Features:**
- Preserves local changes by stashing them
- Automatically installs dependencies
- Works with both initial clone and updates
- Shows clear status messages

---

## 🔧 Manual Git Commands

If you prefer using Git commands manually:

### **Local Machine:**
```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your message here"

# Push to GitHub
git push origin master
```

### **Remote Server:**
```bash
# Pull latest changes
git pull origin master

# Install dependencies
cd BackEND && npm install && cd ..
cd FrontEND && npm install && cd ..

# Run the game
./START_GAME.bat
```

---

## 🛠️ Troubleshooting

### **Problem: "Git is not installed"**
**Solution:** Download and install Git from https://git-scm.com/download/win

### **Problem: "Push failed - Authentication required"**
**Solution:**
1. Generate Personal Access Token at https://github.com/settings/tokens
2. Use token as password when prompted
3. Or use SSH keys for passwordless authentication

### **Problem: "Pull failed - Merge conflicts"**
**Solution:**
1. Stash your local changes: `git stash`
2. Pull again: `git pull origin master`
3. Apply stashed changes: `git stash pop`
4. Resolve conflicts manually if needed

### **Problem: "npm install failed"**
**Solution:**
1. Make sure Node.js is installed
2. Delete `node_modules` folders
3. Run `npm install` again

### **Problem: "Branch name mismatch (master vs main)"**
**Solution:** Both batch files automatically try both `master` and `main` branches

---

## 📁 Files Excluded from Git (`.gitignore`)

These files/folders are NOT synced to GitHub:
- `node_modules/` - Dependencies (too large)
- `dist/` and `build/` - Build outputs (regenerated)
- `.env` and `.env.local` - Secrets and local config
- `.claude/settings.local.json` - Personal Claude settings
- `*.log` - Log files
- `test/` - Test directories

---

## 🎯 Workflow Example

### **Typical Development Cycle:**

**Day 1 - Local Machine:**
1. Make changes to code
2. Double-click `PUSH_TO_GITHUB.bat`
3. Enter: "Added new feature X"
4. Code pushed to GitHub ✓

**Day 1 - Remote Server:**
1. Double-click `SYNC_FROM_GITHUB.bat`
2. Latest code pulled automatically ✓
3. Dependencies installed ✓
4. Run `START_GAME.bat`

**Day 2 - Local Machine:**
1. Fix a bug
2. Double-click `PUSH_TO_GITHUB.bat`
3. Enter: "Fixed bug in Y"
4. Code pushed to GitHub ✓

**Day 2 - Remote Server:**
1. Double-click `SYNC_FROM_GITHUB.bat`
2. Bug fix applied automatically ✓
3. Ready to test!

---

## 💡 Best Practices

### **DO:**
✓ Commit frequently with clear messages
✓ Pull before making major changes
✓ Test locally before pushing
✓ Use meaningful commit messages
✓ Keep `.gitignore` updated

### **DON'T:**
✗ Commit sensitive data (passwords, API keys)
✗ Commit `node_modules` folder
✗ Force push without understanding consequences
✗ Ignore merge conflicts
✗ Commit broken code to master branch

---

## 📞 Support

**Repository:** https://github.com/ItsTejasongithub/git-sync-bridge

**Common Commands:**
```bash
# View commit history
git log --oneline -10

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard origin/master

# View remote repository URL
git remote -v

# Check current branch
git branch
```

---

## 🎉 Summary

**Local Machine:**
- Make changes → Run `PUSH_TO_GITHUB.bat` → Done!

**Remote Server:**
- Run `SYNC_FROM_GITHUB.bat` → Latest code ready!

**That's it!** No manual copy-pasting, no complex commands. Just one click! 🚀

---

*Last Updated: 2026-01-02*
