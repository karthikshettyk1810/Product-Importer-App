# 🎨 Frontend Setup Guide

## Quick Start

### 1. Start Backend Services

**Terminal 1 - Django Server:**
```bash
source venv/bin/activate
python manage.py runserver
```

**Terminal 2 - Celery Worker:**
```bash
source venv/bin/activate
celery -A product_importer worker --loglevel=info
```

**Terminal 3 - Redis:**
```bash
# If not running as service
redis-server

# Or start as service
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### 2. Start Frontend

**Terminal 4 - React App:**
```bash
cd frontend
npm install  # First time only
npm run dev
```

## Access the Application

- **React Frontend:** http://localhost:3000
- **Django Backend:** http://localhost:8000
- **Django Admin:** http://localhost:8000/admin

## Features

### 🎨 Modern UI
- Dark theme with gradient accents
- Smooth animations and transitions
- Responsive design for all devices
- Beautiful hover effects

### ✨ Dashboard
- Drag & drop file upload
- Real-time progress tracking
- Animated progress bar
- File validation
- Error handling with retry

### 📦 Products
- Paginated product list
- Advanced filtering (SKU, name, status)
- Create/Edit/Delete operations
- Bulk delete with confirmation
- Smooth table animations
- Modal forms

### 🔗 Webhooks
- Grid layout for easy viewing
- Create/Edit/Delete webhooks
- Test webhook functionality
- Real-time status updates
- Response time tracking
- Event type badges

## Technology Stack

### Frontend
- **React 19** - Latest React with hooks
- **Vite** - Lightning fast build tool
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Beautiful icons

### Backend
- **Django 4.2** - Web framework
- **Celery** - Async task processing
- **Redis** - Message broker & cache
- **SQLite3** - Database (dev)

## Development Tips

### Hot Reload
Both frontend and backend support hot reload:
- React: Changes reflect instantly
- Django: Auto-reloads on file changes

### API Proxy
Vite proxies API requests to Django:
```javascript
// vite.config.js
proxy: {
  '/products': 'http://localhost:8000',
  '/webhooks': 'http://localhost:8000',
}
```

### Debugging
- React DevTools for component inspection
- Browser console for API calls
- Django logs in terminal
- Celery logs in worker terminal

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

### API Connection Error
- Ensure Django is running on port 8000
- Check CORS settings if needed
- Verify proxy configuration in vite.config.js

### Upload Not Working
- Check Celery worker is running
- Verify Redis is accessible
- Check browser console for errors

### Animations Laggy
- Reduce motion in browser settings
- Check browser performance
- Disable animations in framer-motion config

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

### Serve with Django
1. Build frontend: `npm run build`
2. Copy `dist/` to Django static folder
3. Configure Django to serve static files
4. Set `DEBUG=False` in Django settings

### Environment Variables
Create `.env` file:
```
VITE_API_URL=http://localhost:8000
```

## Performance Optimization

### Frontend
- Code splitting with React.lazy()
- Image optimization
- Bundle size analysis: `npm run build -- --analyze`
- Lazy load heavy components

### Backend
- Database indexing
- Query optimization
- Celery task optimization
- Redis caching

## Customization

### Theme Colors
Edit `frontend/src/App.css`:
```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  /* ... */
}
```

### Animations
Adjust in component files:
```javascript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
```

### Layout
Modify grid layouts in CSS:
```css
.dashboard {
  grid-template-columns: 2fr 1fr;
}
```

## Testing

### Frontend
```bash
cd frontend
npm run test  # If tests configured
```

### Backend
```bash
python manage.py test
```

## Deployment

### Frontend Options
1. **Vercel** - Automatic deployments
2. **Netlify** - Easy setup
3. **AWS S3 + CloudFront** - Scalable
4. **Serve with Django** - Single deployment

### Backend Options
1. **Render** - Easy deployment
2. **Heroku** - Platform as a service
3. **AWS EC2** - Full control
4. **Docker** - Containerized

## Support

For issues or questions:
1. Check browser console
2. Check Django logs
3. Check Celery logs
4. Verify all services are running

## Next Steps

1. ✅ Start all services
2. ✅ Access http://localhost:3000
3. ✅ Upload sample CSV
4. ✅ Explore features
5. ✅ Customize theme
6. ✅ Deploy to production

Enjoy your amazing new UI! 🎉
