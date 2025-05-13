const errorHandler = (err, req, res, next) => {
    if (err.status === 400 && err instanceof SyntaxError) {
        return res.status(400).json({
            error: 'Invalid JSON format in request body',
            details: err.details || err.message,
            timestamp: new Date().toISOString()
        });
    }

    if (err.statusCode === 429) {
        return res.status(429).json({ error: err.message });
    }

    if (!res.headersSent) {
        next(err);
    }
};

module.exports = errorHandler;
