# File Share API - Koyeb with PostgreSQL

A file-sharing service with persistent PostgreSQL storage, deployed on Koyeb.

## Features
- ✅ Upload files via web interface or API
- ✅ Persistent storage in PostgreSQL
- ✅ Get shareable download links
- ✅ Works with Apple Shortcuts
- ✅ Clean, modern UI
- ✅ Files persist across deployments

## Database
- **Provider**: Koyeb PostgreSQL
- **Storage**: All files stored in database as JSONB
- **Persistence**: Files never disappear

## API Endpoints

### Upload Files
**POST** `/api/upload`
- Body: multipart/form-data with file(s)
- Returns: JSON with download link

### Download Files
**GET** `/api/:fileId`
- Returns: File data

### List Files
**GET** `/api/files/list`
- Returns: Array of all uploaded files

### Delete File
**DELETE** `/api/:fileId`
- Returns: Success message

## Deploy to Koyeb

1. Push this code to GitHub
2. Go to https://koyeb.com
3. Click "Create App"
4. Select GitHub repository
5. Koyeb auto-detects Node.js
6. Click "Deploy"
7. Your app is live!

## Apple Shortcuts Usage

**Upload:**
- Method: POST
- URL: `https://your-app.koyeb.app/api/upload`
- Body: Your file(s)

**Download:**
- Method: GET
- URL: Link received from upload

## Environment Variables

The PostgreSQL connection is already configured in the code:
