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
      console.error('Error creating likes table:', err);
    } else {
      console.log('Likes table initialized');
    }
  });

  // Create page views table
  db.run(`
    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_path TEXT NOT NULL,
      page_title TEXT,
      user_fingerprint TEXT NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      referrer TEXT,
      session_id TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating page_views table:', err);
    } else {
      console.log('Page views table initialized');
    }
  });

  // Create indexes for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_post_id ON likes(post_id)`, (err) => {
    if (err) console.error('Error creating likes index:', err);
  });
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_page_path ON page_views(page_path)`, (err) => {
    if (err) console.error('Error creating page_views index:', err);
  });
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_viewed_at ON page_views(viewed_at)`, (err) => {
    if (err) console.error('Error creating viewed_at index:', err);
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

// Track page view
app.post('/api/pageview', (req, res) => {
  const { path, title, referrer, sessionId } = req.body;
  const userFingerprint = getUserFingerprint(req);
  
  // Record the page view
  db.run(
    `INSERT INTO page_views (page_path, page_title, user_fingerprint, referrer, session_id) 
     VALUES (?, ?, ?, ?, ?)`,
    [path, title, userFingerprint, referrer, sessionId],
    function(err) {
      if (err) {
        console.error('Error recording page view:', err);
        res.status(500).json({ error: 'Failed to record page view' });
      } else {
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// Get page view analytics
app.get('/api/analytics', (req, res) => {
  const queries = {
    // Total page views by page
    pageViews: `
      SELECT 
        page_path,
        page_title,
        COUNT(*) as total_views,
        COUNT(DISTINCT user_fingerprint) as unique_visitors,
        MAX(viewed_at) as last_viewed
      FROM page_views
      GROUP BY page_path
      ORDER BY total_views DESC
    `,
    
    // Recent activity (last 24 hours)
    recentActivity: `
      SELECT 
        page_path,
        page_title,
        COUNT(*) as views_24h
      FROM page_views
      WHERE viewed_at > datetime('now', '-24 hours')
      GROUP BY page_path
      ORDER BY views_24h DESC
      LIMIT 10
    `,
    
    // Overall stats
    totalStats: `
      SELECT 
        COUNT(*) as total_page_views,
        COUNT(DISTINCT user_fingerprint) as total_unique_visitors,
        COUNT(DISTINCT page_path) as total_pages_viewed,
        COUNT(DISTINCT session_id) as total_sessions
      FROM page_views
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;

  // Execute all queries
  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`Error in ${key} query:`, err);
        results[key] = { error: err.message };
      } else {
        results[key] = key === 'totalStats' ? rows[0] : rows;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json(results);
      }
    });
  });
});

// Get combined stats (likes + page views)
app.get('/api/dashboard-stats', (req, res) => {
  const query = `
    SELECT 
      COALESCE(pv.page_path, l.post_id) as page_id,
      pv.page_title,
      COALESCE(pv.total_views, 0) as total_views,
      COALESCE(pv.unique_visitors, 0) as unique_visitors,
      COALESCE(l.like_count, 0) as like_count,
      pv.last_viewed
    FROM (
      SELECT 
        page_path,
        page_title,
        COUNT(*) as total_views,
        COUNT(DISTINCT user_fingerprint) as unique_visitors,
        MAX(viewed_at) as last_viewed
      FROM page_views
      GROUP BY page_path
    ) pv
    FULL OUTER JOIN (
      SELECT 
        post_id,
        COUNT(*) as like_count
      FROM likes
      GROUP BY post_id
    ) l ON pv.page_path LIKE '%' || l.post_id || '%'
    ORDER BY total_views DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching dashboard stats:', err);
      res.status(500).json({ error: 'Database error' });
    } else {
      res.json(rows);
    }
  });
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