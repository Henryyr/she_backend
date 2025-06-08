const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { testEmailController } = require('../controllers/user/testController');

// Endpoint: GET /api/test/email
router.get('/', authenticate, testEmailController);

router.post('/socket', (req, res) => {
    try {
        const io = getIO();
        io.to('admin-room').emit('test-event', {
            message: 'Test Socket.IO connection',
            timestamp: new Date().toISOString(),
            data: req.body
        });
        res.json({ success: true, message: 'Test event sent' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send test event' });
    }
});

module.exports = router;
