const express = require('express');

const jsonSanitizer = express.json({
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            const error = new SyntaxError('Invalid JSON');
            error.status = 400;
            error.details = e.message;
            throw error;
        }
    }
});

module.exports = jsonSanitizer;
