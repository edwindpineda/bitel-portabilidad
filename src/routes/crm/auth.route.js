const express = require('express');
const router = express.Router();
const authController = require('../../controllers/crm/auth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const { body } = require('express-validator');
const handleValidation = require('../../middlewares/handleValidation.middleware');

/**
 * POST /api/crm/auth/register
 * Registro de nuevo usuario
 */
router.post('/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3 })
      .withMessage('El usuario debe tener al menos 3 caracteres'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  handleValidation,
  authController.register
);

/**
 * POST /api/crm/auth/login
 * Inicio de sesión
 */
router.post('/login',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('El usuario es obligatorio'),
    body('password')
      .notEmpty()
      .withMessage('La contraseña es obligatoria'),
  ],
  handleValidation,
  authController.login
);

/**
 * GET /api/crm/auth/me
 * Obtener datos del usuario autenticado
 */
router.get('/me',
  authMiddleware,
  authController.me
);

/**
 * POST /api/crm/auth/forgot-password
 * Solicitar reset de contraseña
 */
router.post('/forgot-password',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('El usuario es obligatorio'),
  ],
  handleValidation,
  authController.forgotPassword
);

/**
 * POST /api/crm/auth/reset-password
 * Reset de contraseña con token
 */
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('El token es obligatorio'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  handleValidation,
  authController.resetPassword
);

module.exports = router;
