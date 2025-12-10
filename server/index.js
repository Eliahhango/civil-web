const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const dataHelpers = require('./dataHelpers');
const { 
  securityLogger, 
  securityHeaders, 
  rateLimiter, 
  ipBlocker,
  loadSecurityLogs,
  blockIP,
  unblockIP,
  isIPBlocked
} = require('./middleware/security');
const { validations } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Health check endpoint (before security middleware for monitoring)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Admin panel routes (before security middleware to ensure access)
app.get('/admin', (req, res) => {
  const adminPath = path.join(__dirname, 'admin', 'admin-panel.html');
  res.sendFile(adminPath, (err) => {
    if (err) {
      console.error('Error sending admin panel:', err);
      res.status(500).send('Error loading admin panel');
    }
  });
});

// Serve static files from admin directory (JS, CSS, etc.)
app.use('/admin', express.static(path.join(__dirname, 'admin'), {
  index: false // Don't serve index.html automatically
}));

// Security Middleware (apply first)
app.use(securityHeaders);
app.use(ipBlocker);
app.use(rateLimiter(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(securityLogger);

// CORS with security
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development, restrict in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Data storage paths (kept for uploads directory)
const DATA_DIR = path.join(__dirname, 'data');

// Initialize data and ensure default data exists
async function initializeData() {
  try {
    await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    
    // Ensure users.json exists
    try {
      await fs.access(path.join(__dirname, 'data', 'users.json'));
    } catch {
      await fs.writeFile(path.join(__dirname, 'data', 'users.json'), JSON.stringify([], null, 2));
    }
    
    // Ensure contacts.json exists
    try {
      await fs.access(path.join(__dirname, 'data', 'contacts.json'));
    } catch {
      await fs.writeFile(path.join(__dirname, 'data', 'contacts.json'), JSON.stringify([], null, 2));
    }
    
    // Check if admin user exists, if not create it
    const adminUser = await dataHelpers.getUserByEmail('admin@nexusengineering.co.tz');
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await dataHelpers.createUser({
        username: 'admin',
        email: 'admin@nexusengineering.co.tz',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user created');
    }
    
    // Check if projects exist, if not initialize with default projects
    const projects = await dataHelpers.getProjects();
    if (projects.length === 0) {
      // Load default projects from JSON file
      let defaultProjects = [];
      try {
        const projectsData = await fs.readFile(path.join(__dirname, 'data', 'projects.json'), 'utf8');
        defaultProjects = JSON.parse(projectsData);
      } catch (error) {
        console.log('Projects JSON file not found, using empty array');
      }
      
      // Add projects if we have any
      if (defaultProjects.length > 0) {
        for (const project of defaultProjects) {
          try {
            await dataHelpers.createProject(project);
          } catch (err) {
            console.error(`Error adding project ${project.title}:`, err.message);
          }
        }
        console.log(`Initialized ${defaultProjects.length} projects`);
      }
    } else {
      console.log(`Loaded ${projects.length} existing projects`);
    }
  } catch (error) {
    console.error('Error initializing data:', error);
  }
}

// Old ensureDataDir function - kept for reference but not used
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
  } catch (error) {
    console.error('Error setting up directories:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Nexus Engineering Partners API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login, /api/auth/register',
      projects: '/api/projects',
      services: '/api/services',
      contact: '/api/contact'
    }
  });
});

// Client routes
const clientRoutes = require('./routes/client');
app.use('/api/client', clientRoutes);

// Routes

// Auth Routes
app.post('/api/auth/login', validations.login, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Read user directly from JSON to get password
    const usersPath = path.join(__dirname, 'data', 'users.json');
    let users = [];
    try {
      users = JSON.parse(await fs.readFile(usersPath, 'utf8'));
    } catch (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    
    const user = users.find(u => u.email === email);
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', validations.register, async (req, res) => {
  try {
    const { email, password, username } = req.body;
    const existingUser = await dataHelpers.getUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await dataHelpers.createUser({
      username,
      email,
      password: hashedPassword,
      role: 'client'
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Projects Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await dataHelpers.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await dataHelpers.getProjectById(parseInt(req.params.id));
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/projects', authenticateToken, validations.createProject, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const newProject = await dataHelpers.createProject(req.body);
    res.json(newProject);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/projects/:id', authenticateToken, validations.updateProject, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const project = await dataHelpers.updateProject(parseInt(req.params.id), req.body);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/projects/:id', authenticateToken, validations.deleteProject, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await dataHelpers.deleteProject(parseInt(req.params.id));
    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Contact Routes
app.post('/api/contact', validations.contact, async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    const newContact = await dataHelpers.createContact({
      name,
      email,
      phone,
      message
    });

    // Send email notification (optional)
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'support@nexusengineering.co.tz',
        subject: `New Contact Form Submission from ${name}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/contacts', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const contacts = await dataHelpers.getContacts();
    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const contact = await dataHelpers.updateContact(req.params.id, req.body);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/contacts/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    await dataHelpers.deleteContact(req.params.id);
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Users Routes (for customer management)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const users = await dataHelpers.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Services Routes
app.get('/api/services', (req, res) => {
  const services = [
      {
        id: 1,
        title: 'Structural Design',
        description: 'Advanced structural engineering solutions for residential, commercial, industrial, and institutional buildings.',
        icon: 'building'
      },
      {
        id: 2,
        title: 'Water Infrastructure',
        description: 'Complete water supply systems, wastewater treatment, and sustainable water resource management.',
        icon: 'water'
      },
      {
        id: 3,
        title: 'Bridge Engineering',
        description: 'Comprehensive bridge design, analysis, inspection, and rehabilitation services.',
        icon: 'bridge'
      },
      {
        id: 4,
        title: 'Transportation Engineering',
        description: 'Highway design, traffic engineering, and comprehensive road infrastructure solutions.',
        icon: 'road'
      },
      {
        id: 5,
        title: 'Tender Management',
        description: 'Professional tender documentation, evaluation, and procurement management services.',
        icon: 'document'
      },
      {
        id: 6,
        title: 'Project Management',
        description: 'End-to-end project administration, quality control, and construction supervision.',
        icon: 'chart'
      }
  ];
  res.json(services);
});

// Security Routes (Admin only)
app.get('/api/security/logs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const logs = await loadSecurityLogs();
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const severity = req.query.severity;
    const type = req.query.type;
    
    let filteredLogs = logs;
    
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }
    
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    
    res.json({
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get security logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/security/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const logs = await loadSecurityLogs();
    const last24Hours = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const now = new Date();
      return (now - logTime) < 24 * 60 * 60 * 1000;
    });
    
    const stats = {
      total: logs.length,
      last24Hours: last24Hours.length,
      bySeverity: {
        high: logs.filter(l => l.severity === 'high').length,
        medium: logs.filter(l => l.severity === 'medium').length,
        low: logs.filter(l => l.severity === 'low').length
      },
      byType: {},
      topIPs: {},
      recentAttacks: logs.filter(l => l.detections && l.detections.length > 0).slice(0, 10)
    };
    
    // Count by type
    logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
    });
    
    // Count by IP
    logs.forEach(log => {
      if (log.ip && log.ip !== 'unknown') {
        stats.topIPs[log.ip] = (stats.topIPs[log.ip] || 0) + 1;
      }
    });
    
    // Sort top IPs
    stats.topIPs = Object.entries(stats.topIPs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [ip, count]) => {
        obj[ip] = count;
        return obj;
      }, {});
    
    res.json(stats);
  } catch (error) {
    console.error('Get security stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/security/block-ip', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { ip, reason } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }
    
    blockIP(ip, reason || 'Manually blocked by admin');
    res.json({ message: `IP ${ip} has been blocked` });
  } catch (error) {
    console.error('Block IP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/security/unblock-ip', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { ip } = req.body;
    if (!ip) {
      return res.status(400).json({ error: 'IP address required' });
    }
    
    unblockIP(ip);
    res.json({ message: `IP ${ip} has been unblocked` });
  } catch (error) {
    console.error('Unblock IP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initialize data and start server (only if not running as serverless function)
if (require.main === module) {
  initializeData().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Data storage initialized and ready');
    });
  }).catch((error) => {
    console.error('Failed to initialize data:', error);
    console.log('Server will still start, but data operations may fail.');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  // Running as serverless function - initialize data
  initializeData().catch((error) => {
    console.error('Failed to initialize data:', error);
  });
}

// Export app for serverless functions (Vercel, etc.)
module.exports = app;

