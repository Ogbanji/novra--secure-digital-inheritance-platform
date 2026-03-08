# NOVRA - Quick Reference Guide

## 🚀 Start in 30 Seconds

```bash
# 1. Install
npm install && cd backend && npm install && cd ../frontend && npm install

# 2. Run
cd .. && npm run dev

# 3. Open
# Frontend: http://localhost:3001
# Backend: http://localhost:3000
```

---

## 📁 Project Structure

```
novra/
├── backend/              ← Express API (port 3000)
│   ├── server.js        ← Main server
│   ├── database.js      ← SQLite schema
│   ├── routes/          ← API endpoints
│   ├── middleware/      ← Auth & logging
│   ├── utils/           ← Encryption
│   └── services/        ← Advanced crypto
├── frontend/            ← Next.js app (port 3001)
│   ├── app/
│   │   ├── page.tsx     ← Homepage
│   │   ├── login/       ← Auth pages
│   │   ├── register/    ← Registration
│   │   ├── dashboard/   ← Main dashboard
│   │   └── lib/         ← Stores & API
│   └── public/          ← Static assets
└── docs/
    ├── ARCHITECTURE.md  ← Complete design (50+ pages)
    ├── DEPLOYMENT.md    ← Production guide
    └── README.md        ← Main documentation
```

---

## 🔑 Key Endpoints

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Current user

### Vault
- `GET /api/vault` - List files
- `POST /api/vault/upload` - Upload file
- `DELETE /api/vault/:id` - Delete file

### Heirs
- `GET /api/heirs` - List heirs
- `POST /api/heirs` - Add heir
- `DELETE /api/heirs/:id` - Remove heir

### Inheritance
- `GET /api/inheritance` - List rules
- `POST /api/inheritance` - Create rule
- `GET /api/inheritance/inactivity-status` - Check status

---

## 🔒 Encryption

**All data encrypted with:**
- AES-256-GCM (vault data)
- PBKDF2 100k iterations (key derivation)
- Shamir Secret Sharing 5/3 (key splitting)

**Client-Side Only:**
- No plaintext stored on server
- All encryption happens in browser
- Server stores encrypted blobs only

---

## 👥 User Roles

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| Owner | Everything | N/A |
| Primary Heir | View vault after trigger | Modify rules |
| Alternate Heir | View partial vault | Access all files |
| Trustee | Approve releases | Access data |
| Advisor | View status only | Access vault |

---

## ⏱️ Dead-Man Switch Thresholds

- 30 days (monthly check)
- 60 days (bi-monthly check)
- 90 days (quarterly check)
- 180 days (semi-annual check)
- 1+ years (annual check)

**7-day grace period** before trigger activates.

---

## 💾 Database Tables

1. **users** - Accounts
2. **vaults** - Encrypted files
3. **heirs** - Beneficiaries
4. **inheritance_rules** - Release conditions
5. **messages** - Personal messages
6. **audit_logs** - Activity tracking
7. **smart_contracts** - Blockchain records
8. **heir_access_logs** - Access history

---

## 🔐 Security Features

✅ End-to-end encryption  
✅ Zero-knowledge storage  
✅ JWT authentication  
✅ PBKDF2 password hashing  
✅ Audit logging  
✅ Rate limiting ready  
✅ CORS protection  
✅ Helmet headers  

---

## 📊 Core Statistics

| Metric | Value |
|--------|-------|
| API Endpoints | 30+ |
| Database Tables | 8 |
| Frontend Pages | 5+ |
| Lines of Code | 5,000+ |
| Encryption Strength | 256-bit |
| Secret Sharing | 5/3 threshold |
| Audit Logging | All actions |

---

## 🚀 Deployment

### Local
```bash
npm run dev
```

### Docker
```bash
docker-compose up
```

### CreateOS
```bash
createos deploy --config docker-compose.yml
```

### Traditional
```bash
npm run build && npm start
```

---

## 🧪 Test Account

**Email:** test@novra.io  
**Password:** TestPassword123  

Create test account in app or via API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@novra.io","password":"TestPassword123"}'
```

---

## 📱 API Request Example

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}'

# Get user profile
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-key
FRONTEND_URL=http://localhost:3001
DATABASE_PATH=./database.db
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_CHAIN_ID=1
```

---

## 🔧 Common Tasks

### Create User
```javascript
// via API
POST /api/auth/register
{ email, password }
```

### Upload File
```javascript
// via API
POST /api/vault/upload
{ fileName, fileType, encryptedContent, authTag, nonce }
```

### Add Heir
```javascript
// via API
POST /api/heirs
{ email, name, relationship, inheritanceShare }
```

### Create Rule
```javascript
// via API
POST /api/inheritance
{ ruleType, beneficiaries, triggerCondition }
```

---

## 🐛 Troubleshooting

### Port 3000 in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Database locked
```bash
rm database.db-wal database.db-shm
```

### Module not found
```bash
cd backend && npm install
cd ../frontend && npm install
```

### API timeout
```bash
# Increase timeout in lib/api.ts
timeout: 30000  // 30 seconds
```

---

## 📚 Documentation Links

- **ARCHITECTURE.md** - Complete 50+ page design
- **DEPLOYMENT.md** - Production deployment
- **README.md** - Full documentation
- **PROJECT_SUMMARY.md** - Technical overview
- **QUICK_REFERENCE.md** - This file

---

## 🎯 Key Features at a Glance

1. **Vault Storage** - Encrypted file storage
2. **Heir Management** - Add multiple heirs with roles
3. **Dead-Man Switch** - Auto-trigger after inactivity
4. **Time-Locked Release** - Schedule data releases
5. **Inheritance Rules** - Complex release conditions
6. **Smart Contracts** - Blockchain verification
7. **Audit Logging** - Complete activity tracking
8. **Security Framework** - Military-grade encryption

---

## 💡 Pro Tips

1. **Check Health:** `curl http://localhost:3000/health`
2. **View Database:** `sqlite3 backend/database.db ".tables"`
3. **Monitor Logs:** `tail -f backend/server.log`
4. **Scale Up:** `createos scale novra=3`
5. **Backup Data:** `cp database.db backup.db`

---

## 📞 Support

- **GitHub Issues:** Report bugs
- **Email:** support@novra.io
- **Security:** security@novra.io
- **Docs:** See ARCHITECTURE.md

---

**Version:** 1.0.0  
**Status:** Production-Ready  
**Last Updated:** March 2024