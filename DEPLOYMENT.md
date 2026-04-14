# Deployment Guide - Render

## Prerequisites
- GitHub account
- Render account (free tier works)

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Create Web Service on Render
1. Go to https://render.com/dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`

### 3. Configure Environment Variables
Render will prompt you to set these **REQUIRED** variables:

- `ADMIN_USERNAME` - Your admin username (e.g., "admin")
- `ADMIN_PASSWORD` - **Strong password** for admin user

Optional variables (already set in render.yaml):
- `JWT_SECRET` - Auto-generated
- `ADMIN_FULLNAME` - Admin's full name
- `ADMIN_EMAIL` - Admin's email
- `ENABLE_DEMO_DATA` - Set to `false` for production

### 4. Deploy
Click **Apply** and Render will:
- Install dependencies
- Start the server
- Provide a public URL

## Important Notes

### Database Persistence
⚠️ **Render free tier uses ephemeral storage** - your SQLite database will reset on every restart.

**Solutions:**
1. **Add Persistent Disk** ($1/month)
   - Go to your service dashboard
   - Add disk mounted at `/opt/render/project/src/data`
   - Database survives restarts

2. **Upgrade to PostgreSQL** (free on Render)
   - Requires code changes
   - More reliable for production

3. **Accept resets** (demo/testing only)
   - Data resets on each deployment/restart
   - Admin user auto-recreates from env vars

### Security Checklist
- ✓ Set strong `ADMIN_PASSWORD`
- ✓ `JWT_SECRET` is auto-generated
- ✓ Set `ENABLE_DEMO_DATA=false` for production
- ✓ Update `ADMIN_EMAIL` to your real email

### After Deployment
1. Visit your Render URL
2. Login with your admin credentials
3. Create additional users through the admin panel
4. Add your books

## Troubleshooting

**Server won't start:**
- Check Render logs for errors
- Verify `ADMIN_PASSWORD` is set
- Ensure all required env vars are configured

**Database resets:**
- Add persistent disk (see above)
- Or migrate to PostgreSQL

**Can't login:**
- Check admin credentials in Render env vars
- Database may have reset (check logs)

## Local Development
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Install dependencies
npm install

# Run locally
npm run dev
```

Access at: http://localhost:3000
