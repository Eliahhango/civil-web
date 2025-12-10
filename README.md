# EliTechWiz Website

A fully functional website for EliTechWiz  Firm with both frontend and backend systems.

## Features

- **Frontend (React + Vite + Tailwind CSS)**
  - Modern, responsive design
  - Home page with hero section
  - Services showcase
  - Projects portfolio
  - About Us page
  - Team page
  - Contact form
  - Client login/registration
  - Admin dashboard

- **Backend (Node.js + Express)**
  - RESTful API
  - JWT authentication
  - Project management
  - Contact form handling
  - Email notifications (optional)
  - File upload support

## Tech Stack

- **Frontend:**
  - React 18
  - Vite
  - Tailwind CSS
  - React Router
  - Axios

- **Backend:**
  - Node.js
  - Express
  - JWT for authentication
  - bcryptjs for password hashing
  - Nodemailer for emails (optional)
  - Multer for file uploads

## Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

   Or manually:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run separately:

**Backend (Port 5000):**
```bash
npm run server
```

**Frontend (Port 3000):**
```bash
npm run client
```

### Production Build

Build the frontend:
```bash
npm run build
```

The built files will be in `client/dist/`

## Default Admin Credentials

- **Email:** admin@enggconsult.co.tz
- **Password:** admin123

⚠️ **Important:** Change these credentials in production!

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

For email functionality, you'll need to configure SMTP settings. Gmail requires an app-specific password.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project (Admin only)
- `PUT /api/projects/:id` - Update project (Admin only)
- `DELETE /api/projects/:id` - Delete project (Admin only)

### Services
- `GET /api/services` - Get all services

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contacts` - Get all contacts (Admin only)

## Project Structure

```
civil web/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   └── ...
│   └── package.json
├── server/                 # Express backend
│   ├── data/              # JSON data storage
│   ├── uploads/           # Uploaded files
│   ├── index.js           # Server entry point
│   └── package.json
└── package.json           # Root package.json
```

## Data Storage

The application uses JSON files for data storage by default:
- `server/data/users.json` - User accounts
- `server/data/projects.json` - Projects
- `server/data/contacts.json` - Contact submissions

For production, consider migrating to a proper database (MongoDB, PostgreSQL, etc.).

## Features Overview

### Public Pages
- **Home:** Hero section, services preview, why choose us, projects preview
- **About:** Company information, mission, vision, values
- **Services:** Detailed service listings with features
- **Projects:** Project portfolio gallery
- **Team:** Team member profiles
- **Contact:** Contact form and information

### Client Features
- User registration and login
- Access to client-specific features (can be extended)

### Admin Features
- Project management (CRUD operations)
- View contact form submissions
- Admin dashboard

## Customization

### Changing Colors
Edit `client/tailwind.config.js` to customize the color scheme.

### Adding Services
Services are defined in `server/index.js` in the services route. You can modify the array or connect to a database.

### Adding Team Members
Edit `client/src/pages/Team.jsx` to add or modify team members.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is created for ENGG CONSULT Company Limited.
