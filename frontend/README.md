# Product Importer - React Frontend

Modern, animated React frontend for the Product Importer application.

## Features

- 🎨 Beautiful modern UI with dark theme
- ✨ Smooth animations with Framer Motion
- 📱 Fully responsive design
- ⚡ Real-time progress tracking with SSE
- 🎯 Drag & drop file upload
- 🔄 Smooth page transitions
- 🎭 Interactive hover effects

## Tech Stack

- React 19
- Vite
- Framer Motion (animations)
- Axios (API calls)
- React Router (routing)
- Lucide React (icons)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The app will run on http://localhost:3000

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── pages/
│   ├── Dashboard.jsx    # CSV upload page
│   ├── Products.jsx     # Product management
│   └── Webhooks.jsx     # Webhook configuration
├── App.jsx              # Main app with routing
├── App.css              # Global styles
└── main.jsx             # Entry point
```

## API Integration

The frontend proxies API requests to the Django backend running on port 8000.

Make sure the Django server is running before starting the frontend.

## Features by Page

### Dashboard
- Drag & drop CSV upload
- Real-time progress bar with SSE
- Smooth animations
- File validation
- Error handling

### Products
- Paginated product list
- Advanced filtering
- Create/Edit/Delete products
- Bulk delete with confirmation
- Smooth table animations

### Webhooks
- Grid layout for webhooks
- Create/Edit/Delete webhooks
- Test webhook functionality
- Status indicators
- Response time tracking

## Customization

Colors and theme can be customized in `App.css` using CSS variables:

```css
:root {
  --primary: #6366f1;
  --secondary: #8b5cf6;
  --success: #10b981;
  --danger: #ef4444;
  /* ... */
}
```

## Performance

- Code splitting with React Router
- Lazy loading of components
- Optimized animations
- Efficient re-renders with React hooks

Enjoy the amazing UI! 🚀
