# Quick Start Guide

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)

## Installation Steps

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

3. **Access the website:**
   - Open your browser and go to: http://localhost:3000

## Default Login Credentials

**Admin Account:**
- Email: `admin@enggconsult.co.tz`
- Password: `admin123`

## First Steps

1. Visit the website at http://localhost:3000
2. Explore the public pages (Home, About, Services, Projects, Team, Contact)
3. Try submitting a contact form
4. Login as admin to access the admin dashboard
5. Add/edit projects from the admin panel

## Troubleshooting

### Port Already in Use
If port 5000 or 3000 is already in use:
- Backend: Change `PORT` in `server/index.js` or set `PORT` environment variable
- Frontend: Change port in `client/vite.config.js`

### Dependencies Issues
If you encounter dependency issues:
```bash
# Remove node_modules and reinstall
rm -rf node_modules client/node_modules server/node_modules
npm run install-all
```

### Email Configuration (Optional)
Email functionality requires SMTP configuration. To enable:
1. Create `.env` file in `server/` directory
2. Add your email credentials:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

## Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Serve the built files from `client/dist/` using a web server (nginx, Apache, etc.)

3. Run the backend server:
   ```bash
   cd server
   npm start
   ```

4. Set environment variables for production (JWT_SECRET, etc.)

## Need Help?

- Check the main README.md for detailed documentation
- Review the code comments in the source files
- Contact support@enggconsult.co.tz

