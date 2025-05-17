const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

router.get('/dashboard', authenticateToken, (req, res) => {
    res.send(`<h1>Welcome ${req.user.username}, to your dashboard</h1>`);
});

module.exports = router;