# Tour Likes System Documentation

## Overview
A like tracking system for Tour with Mark that runs independently from the static site. The static site continues to be hosted on GitHub/Netlify, while this DigitalOcean server handles the likes API.

## Architecture
- **Static Site**: Hosted on GitHub/Netlify (tourwithmark.com)
- **Likes API**: Running on this DigitalOcean server at `http://159.203.106.224:3000`
- **Database**: SQLite (server/likes.db)
- **Process Manager**: PM2 for auto-restart and monitoring

## Features
- ✅ Graceful degradation - if API is down, site still works
- ✅ No user accounts required
- ✅ One like per user per post (tracked by browser fingerprint)
- ✅ Real-time like counts
- ✅ Caching for offline support
- ✅ Automatic restart on server reboot

## File Structure
```
tourwithmark_2025/
├── server/                    # API server directory
│   ├── app.js                # Express API server
│   ├── likes.db              # SQLite database
│   ├── ecosystem.config.js   # PM2 configuration
│   ├── package.json          # Node dependencies
│   └── logs/                 # PM2 logs
├── tour-likes.js             # Frontend JavaScript
├── tour-likes.css            # Styling
└── tours/_metadata.yml       # Template integration
```

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/likes/:postId` - Get like count for a post
- `POST /api/likes/:postId` - Toggle like for a post
- `GET /api/stats` - Get all posts' like counts

## Server Management

### Check Status
```bash
npx pm2 status
```

### View Logs
```bash
npx pm2 logs tour-likes-api
```

### Restart Server
```bash
npx pm2 restart tour-likes-api
```

### Stop Server
```bash
npx pm2 stop tour-likes-api
```

### Monitor Resources
```bash
npx pm2 monit
```

## Database Management

### View Database
```bash
sqlite3 server/likes.db
.tables
SELECT * FROM likes;
.quit
```

### Backup Database
```bash
cp server/likes.db server/likes.db.backup
```

## Deployment Steps

### For Static Site (GitHub/Netlify)
1. Commit and push changes to GitHub:
   - `tour-likes.js`
   - `tour-likes.css`
   - `tours/_metadata.yml`

2. Netlify will automatically deploy

### For This Server
The API is already running with PM2 and will auto-restart on reboot.

## Testing
1. Open `test-likes.html` in a browser
2. Or test with curl:
```bash
# Get like count
curl http://159.203.106.224:3000/api/likes/test-post

# Add/toggle like
curl -X POST http://159.203.106.224:3000/api/likes/test-post
```

## Troubleshooting

### API Not Accessible
1. Check if server is running: `npx pm2 status`
2. Check logs: `npx pm2 logs`
3. Verify port 3000 is open: `sudo ufw status`
4. Test locally: `curl http://localhost:3000/api/health`

### Database Issues
1. Check database exists: `ls -la server/likes.db`
2. Verify tables: `sqlite3 server/likes.db ".tables"`
3. Check permissions: `ls -la server/`

### Frontend Not Showing Likes
1. Check browser console for errors
2. Verify API is accessible from browser
3. Check CORS settings in `server/app.js`
4. Clear browser cache and localStorage

## Security Notes
- CORS is configured to allow your domain
- Rate limiting prevents spam (100 requests per 15 minutes per IP)
- User fingerprinting prevents multiple likes from same browser
- No sensitive data stored (just post IDs and hashed fingerprints)

## Maintenance
- Database is automatically backed up by SQLite's journal mode
- PM2 logs are rotated automatically
- Consider periodic database cleanup of old likes if needed

## Future Enhancements
- Add admin dashboard to view statistics
- Implement like animations
- Add "most liked" widget
- Export analytics data
- Add webhook notifications for milestones