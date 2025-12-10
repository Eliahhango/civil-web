// Client-specific routes
const express = require('express');
const router = express.Router();
const dataHelpers = require('../dataHelpers');
const jwt = require('jsonwebtoken');

// Authentication middleware for client routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Get client's assigned projects
router.get('/projects', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Client access only' });
    }
    
    // For now, return all projects. Later you can filter by client ID
    const projects = await dataHelpers.getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Get client projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get client's project progress
router.get('/projects/:id/progress', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Client access only' });
    }
    
    const project = await dataHelpers.getProjectById(parseInt(req.params.id));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Return project with progress (you can add progress tracking later)
    res.json({
      ...project,
      progress: project.progress || 75, // Default progress
      status: project.status || 'in-progress'
    });
  } catch (error) {
    console.error('Get project progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get client's payment history
router.get('/payments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Client access only' });
    }
    
    // Mock payment data - you can implement real payment tracking later
    const payments = [
      {
        id: 1,
        project: 'Commercial Building Project',
        amount: 50000,
        status: 'paid',
        date: '2025-01-15',
        invoice: '#INV-001'
      },
      {
        id: 2,
        project: 'Bridge Engineering Project',
        amount: 75000,
        status: 'pending',
        date: '2025-01-20',
        invoice: '#INV-002'
      }
    ];
    
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

