// utils/general.js
const getFrontendURL = () => {
    return process.env.FRONTEND_URL || 'http://localhost:3000';
};

module.exports = { getFrontendURL };
