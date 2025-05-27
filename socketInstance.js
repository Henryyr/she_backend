let ioInstance = null;

module.exports = {
    setIO: (io) => { ioInstance = io; },
    getIO: () => {
        if (!ioInstance) {
            throw new Error('Socket.IO instance has not been initialized. Call setIO(io) first.');
        }
        return ioInstance;
    }
};
