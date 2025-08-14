const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow your static site
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://tourwithmark.com',
      'https://www.tourwithmark.com',
      'http://localhost:4000',
      'http://127.0.0.1:4000',
      // Add your Netlify URL if different
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('netlify')) {
      callback(null, true);
    } else {
      callback(null, true); // For now, allow all origins during development
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting to prevent spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Initialize SQLite database
const db = new sqlite3.Database('./likes.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Create tables if they don't exist
function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id TEXT NOT NULL,
      user_fingerprint TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_fingerprint)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('Database initialized');
    }
  });

  // Create index for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_post_id ON likes(post_id)`, (err) => {
    if (err) console.error('Error creating index:', err);
  });
}

// Helper function to get user fingerprint
function getUserFingerprint(req) {
  // Simple fingerprinting based on IP and user agent
  // In production, you might want to use a more sophisticated approach
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const fingerprint = `${ip}-${userAgent}`.substring(0, 255);
  return Buffer.from(fingerprint).toString('base64');
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get like count for a post
app.get('/api/likes/:postId', (req, res) => {
  const { postId } = req.params;
  const userFingerprint = getUserFingerprint(req);
  
  // Get total count and whether current user has liked
  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM likes WHERE post_id = ?) as count,
      (SELECT COUNT(*) FROM likes WHERE post_id = ? AND user_fingerprint = ?) as user_liked`,
    [postId, postId, userFingerprint],
    (err, row) => {
      if (err) {
        console.error('Error fetching likes:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json({
          count: row.count || 0,
          userLiked: row.user_liked > 0
        });
      }
    }
  );
});

// Toggle like for a post
app.post('/api/likes/:postId', (req, res) => {
  const { postId } = req.params;
  const userFingerprint = getUserFingerprint(req);
  
  // Check if user has already liked
  db.get(
    'SELECT id FROM likes WHERE post_id = ? AND user_fingerprint = ?',
    [postId, userFingerprint],
    (err, row) => {
      if (err) {
        console.error('Error checking like:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      
      if (row) {
        // User has liked, so unlike
        db.run(
          'DELETE FROM likes WHERE post_id = ? AND user_fingerprint = ?',
          [postId, userFingerprint],
          function(err) {
            if (err) {
              console.error('Error removing like:', err);
              res.status(500).json({ error: 'Failed to remove like' });
            } else {
              // Get new count
              db.get(
                'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
                [postId],
                (err, row) => {
                  res.json({
                    liked: false,
                    count: row ? row.count : 0
                  });
                }
              );
            }
          }
        );
      } else {
        // User hasn't liked, so add like
        db.run(
          'INSERT INTO likes (post_id, user_fingerprint) VALUES (?, ?)',
          [postId, userFingerprint],
          function(err) {
            if (err) {
              console.error('Error adding like:', err);
              res.status(500).json({ error: 'Failed to add like' });
            } else {
              // Get new count
              db.get(
                'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
                [postId],
                (err, row) => {
                  res.json({
                    liked: true,
                    count: row ? row.count : 0
                  });
                }
              );
            }
          }
        );
      }
    }
  );
});

// Get all likes stats (optional admin endpoint)
app.get('/api/stats', (req, res) => {
  db.all(
    `SELECT post_id, COUNT(*) as count 
     FROM likes 
     GROUP BY post_id 
     ORDER BY count DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: 'Database error' });
      } else {
        res.json(rows);
      }
    }
  );
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Like API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing database...');
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});