const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  username: body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  
  projectId: param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid project ID'),
  
  contactId: param('id')
    .notEmpty()
    .withMessage('Contact ID is required'),
  
  title: body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .escape(),
  
  description: body('description')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters')
    .escape(),
  
  name: body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name contains invalid characters')
    .escape(),
  
  phone: body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format')
    .escape(),
  
  message: body('message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters')
    .escape()
};

// Validation middleware for routes
const validations = {
  login: [
    commonValidations.email,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  
  register: [
    commonValidations.username,
    commonValidations.email,
    commonValidations.password,
    handleValidationErrors
  ],
  
  createProject: [
    commonValidations.title,
    commonValidations.description,
    body('category').optional().trim().escape(),
    body('location').optional().trim().escape(),
    body('year').optional().trim().escape(),
    body('image').optional().isURL().withMessage('Invalid image URL'),
    body('images').optional(),
    handleValidationErrors
  ],
  
  updateProject: [
    param('id').isInt({ min: 1 }).withMessage('Invalid project ID'),
    commonValidations.title.optional(),
    commonValidations.description.optional(),
    body('category').optional().trim().escape(),
    body('location').optional().trim().escape(),
    body('year').optional().trim().escape(),
    body('image').optional().isURL().withMessage('Invalid image URL'),
    handleValidationErrors
  ],
  
  deleteProject: [
    commonValidations.projectId,
    handleValidationErrors
  ],
  
  contact: [
    commonValidations.name,
    commonValidations.email,
    commonValidations.phone,
    commonValidations.message,
    handleValidationErrors
  ],
  
  updateContact: [
    commonValidations.contactId,
    body('read').optional().isBoolean().withMessage('Read status must be boolean'),
    handleValidationErrors
  ],
  
  deleteContact: [
    commonValidations.contactId,
    handleValidationErrors
  ]
};

module.exports = {
  validations,
  handleValidationErrors,
  commonValidations
};

