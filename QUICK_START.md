# Novra - Quick Start Guide

Get Novra running in 5 minutes.

## Prerequisites

- Node.js 18+
- npm or yarn
- 2GB free disk space

## Step 1: Install Dependencies (2 minutes)

```bash
# Install all dependencies at once
npm install

# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

## Step 2: Configure Environment (30 seconds)

```bash
# Copy example config
cp .env.example .env.local

# No changes needed for local development
# Backend: localhost:3000
# Frontend: localhost:3001
```

## Step 3: Start the Application (30 seconds)

```bash
# Start both backend and frontend
npm run dev
```

You should see:
```
Novra Backend running on http://0.0.0.0:3000
[next.js] ready - started server on 0.0.0.0:3001
```

## Step 4: Open in Browser (10 seconds)

Visit: **http://localhost:3001**

You'll see the Novra homepage with:
- Sign In button (top right)
- Features overview
- Pricing plans
- Call-to-action buttons

## Step 5: Test the Application (2 minutes)

### Create Account
1. Click "Create Legacy" button
2. Enter email: `test@example.com`
3. Enter password: `TestPassword@123`
4. Answer security questions
5. Click "Create Account"

You'll be redirected to onboarding tour.

### Complete Onboarding
1. Read through 5 onboarding steps
2. Click "Next" for each step
3. Click "Go to Dashboard" on final step

### Try the Dashboard
1. View your stats (0 items, 0 heirs)
2. Click "Upload File" to add a vault item
3. Click "Add Heir" to designate an heir
4. Click "Create Rule" to set inheritance rules
5. Click "Settings" to manage security

## Key Files to Explore

### Backend
- **server.js** - Main API server
- **database.js** - SQLite setup
- **services/encryption.js** - All encryption logic
- **routes/** - API endpoints

### Frontend
- **app/page.tsx** - Homepage
- **app/dashboard/page.tsx** - Main dashboard
- **lib/store.ts** - State management
- **lib/api.ts** - API client

## Testing Specific Features

### Test Encryption
```javascript
// In browser console:
const { generateNonce, deriveKey, encryptData } = require('./app/lib/encryption.ts');
const nonce = generateNonce();
const key = deriveKey('TestPassword@123', 'salt123');
const encrypted = encryptData({ message: 'Hello' }, key, nonce);
console.log(encrypted);
```

### Test API Directly
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword@123","securityQuestions":{}}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword@123"}'
```

## Stop the Application

Press `Ctrl+C` in the terminal.

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Error
```bash
# Reset database
rm backend/database.db

# Restart
npm run dev
```

### Module Not Found
```bash
# Reinstall everything
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
npm run dev
```

## What's Happening Behind the Scenes

### User Registration Flow
1. Frontend: Derive key from password using PBKDF2
2. Frontend: Hash password (optional extra layer)
3. Backend: Store hashed password + salt
4. Backend: Generate JWT token
5. Frontend: Store token in localStorage
6. Frontend: Redirect to onboarding

### Vault Upload Flow
1. User: Select file to upload
2. Frontend: Generate random nonce
3. Frontend: Derive encryption key from password
4. Frontend: AES-256 encrypt file with nonce
5. Frontend: Send encrypted blob + nonce to backend
6. Backend: Store encrypted blob in SQLite
7. Backend: Never has access to original file

### Heir Access Flow
1. Time passes, inactivity detected
2. Backend: Triggers inheritance rule (via cron)
3. Backend: Marks rule as "triggered"
4. Heir: Receives email with recovery link
5. Heir: Proves identity (answers recovery question)
6. System: Generates temporary decryption key
7. Heir: Receives key valid for 30 days
8. Heir: Decrypts vault on their device

## Next Steps

### Explore the Architecture
Read **ARCHITECTURE.md** (20K+ words) for:
- Complete system design
- Advanced features explanation
- Security architecture details
- Monetization strategy
- Competitive analysis

### Deploy to Production
Follow **IMPLEMENTATION_GUIDE.md** for:
- CreateOS deployment
- Production environment setup
- Security audit checklist
- Performance monitoring

### Add More Features
See **ARCHITECTURE.md** Phase 2-4 roadmap:
- Smart contract deployment UI
- AI will assistant
- Blockchain integration
- Mobile apps

## Quick Reference

| Task | Command |
|------|---------|
| Start dev | `npm run dev` |
| Stop dev | `Ctrl+C` |
| Build frontend | `cd frontend && npm run build` |
| Build backend | `cd backend && npm run build` |
| Backend only | `cd backend && npm start` |
| Frontend only | `cd frontend && npm run dev` |
| Reset DB | `rm backend/database.db && npm run dev` |
| Check API | `curl http://localhost:3000/health` |

## Support

- **Questions**: Check ARCHITECTURE.md and IMPLEMENTATION_GUIDE.md
- **Issues**: Report on GitHub
- **Improvements**: Submit pull request

## Success!

You now have a fully functional digital inheritance platform running locally. 

Next, explore the codebase and read the architecture document to understand all the capabilities.

**Happy building!** 🚀