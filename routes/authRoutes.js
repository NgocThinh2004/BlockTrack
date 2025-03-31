const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login routes with proper callbacks
router.get('/login', authController.getLogin || ((req, res) => res.render('auth/login', { title: 'Đăng nhập', error: null })));
router.post('/login', authController.postLogin || ((req, res) => res.redirect('/')));

// Register routes with fallback handlers
router.get('/register', authController.getRegister || ((req, res) => res.render('auth/register', { title: 'Đăng ký', error: null })));
router.post('/register', authController.postRegister || ((req, res) => res.redirect('/')));

// Other routes with fallbacks
router.get('/logout', authController.logout || ((req, res) => { req.session.destroy(); res.redirect('/'); }));
router.get('/profile', authController.getProfile || ((req, res) => res.redirect('/')));
router.post('/profile', authController.updateProfile || ((req, res) => res.redirect('/')));
router.post('/change-password', authController.changePassword || ((req, res) => res.redirect('/')));

module.exports = router;
