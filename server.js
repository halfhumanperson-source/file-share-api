const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8000;

// PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://koyeb-adm:npg_4wqWoTZIz8Ob@ep-mute-butterfly-ag9zeaud.c-2.eu-central-1.pg.koyeb.app/koyebdb';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected:', res.rows[0].now);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Root route - serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Upload endpoint - POST /api/upload
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const fileId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    
    const files = req.files.map(file => ({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      data: file.buffer.toString('base64')
    }));

    const fileData = {
      id: fileId,
      files: files,
      uploadedAt: new Date().toISOString()
    };

    // Save to PostgreSQL
    await pool.query(
      'INSERT INTO files (id, file_data, uploaded_at) VALUES ($1, $2, $3)',
      [fileId, JSON.stringify(fileData), new Date()]
    );

    const downloadLink = `${req.protocol}://${req.get('host')}/api/${fileId}`;
    
    res.json({
      success: true,
      link: downloadLink,
      fileId: fileId,
      fileCount: files.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Download endpoint - GET /api/:fileId
app.get('/api/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    const result = await pool.query(
      'SELECT file_data FROM files WHERE id = $1',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileData = JSON.parse(result.rows[0].file_data);

    // If single file, return it directly
    if (fileData.files.length === 1) {
      const file = fileData.files[0];
      const buffer = Buffer.from(file.data, 'base64');
      
      res.setHeader('Content-Type', file.type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      res.send(buffer);
    } else {
      // Multiple files - return as JSON
      res.json({
        success: true,
        fileCount: fileData.files.length,
        files: fileData.files.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          data: f.data
        }))
      });
    }
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed: ' + error.message });
  }
});

// List all files endpoint - GET /api/files/list
app.get('/api/files/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT file_data FROM files ORDER BY uploaded_at DESC'
    );

    const files = result.rows.map(row => {
      const data = JSON.parse(row.file_data);
      return {
        id: data.id,
        fileCount: data.files.length,
        files: data.files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })),
        uploadedAt: data.uploadedAt
      };
    });

    res.json({ success: true, files: files });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'Failed to list files: ' + error.message });
  }
});

// Delete endpoint - DELETE /api/:fileId
app.delete('/api/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    
    const result = await pool.query(
      'DELETE FROM files WHERE id = $1 RETURNING id',
      [fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 File Share API running on port ${PORT}`);
  console.log(`📁 Upload: POST to /api/upload`);
  console.log(`📥 Download: GET /api/:fileId`);
  console.log(`🗄️  Database: PostgreSQL (Koyeb)`);
});
