# Next.js Setup Guide

Your IDP Dashboard has been converted to Next.js with full page reloads!

## What Changed

- **Framework**: Converted from Vite/React to Next.js
- **Navigation**: Now uses full page reloads (no SPA behavior)
- **Design**: Exact same design and UI
- **Routing**: URLs change when navigating (`/dashboard?view=catalog`, etc.)

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- Next.js 15
- React 19
- All other dependencies

### 2. Start Development Server

```bash
# Terminal 1: Start backend
cd frontend/backend
node server.js

# Terminal 2: Start Next.js frontend
cd frontend
npm run dev
```

The app will be available at: **http://localhost:3000**

## How Navigation Works Now

Unlike before where navigation was instant (SPA), now clicking links will:
- Reload the entire page
- Show a loading state briefly
- Provide full browser history support

### Routes:
- `/` - Login page
- `/dashboard?view=catalog` - Catalog view
- `/dashboard?view=create` - Create templates
- `/dashboard?view=create-detail&template=python-service` - Template detail page

## Building for Production

```bash
npm run build
npm start
```

## Key Features Maintained

✅ Same beautiful design  
✅ Terraform Cloud integration  
✅ Real-time status updates  
✅ Delete button with disable state  
✅ Horizontal card layout  
✅ All functionality intact  

## Differences from Before

- **Full page reloads**: Every navigation triggers a browser reload
- **URL-based routing**: URLs contain query parameters
- **Better history**: Browser back/forward buttons work naturally
- **Server-side rendering**: Better SEO and initial load

## Troubleshooting

If you encounter issues:

1. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   ```

2. **Reinstall dependencies**:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Check backend is running**: Ensure backend on port 4000

4. **Check console**: Open browser DevTools for any errors

## Switching Back to Vite

If you want to switch back to Vite:

```bash
# In package.json, change scripts back to:
"dev": "vite",
"build": "vite build",
"preview": "vite preview"

# And install Vite dependencies
npm install vite @vitejs/plugin-react --save-dev
```

The old vite.config.ts file is still there if needed.

