const transactionService = require('../../services/admin/transactionService');

const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status; // ambil status dari query
        const startDate = req.query.startDate; // ambil startDate dari query
        const endDate = req.query.endDate; // ambil endDate dari query
        const transactions = await transactionService.getAllTransactions(page, limit, status, startDate, endDate);

        transactions.pagination.hasNextPage = page < transactions.pagination.totalPages;
        transactions.pagination.hasPrevPage = page > 1;
        transactions.pagination.nextPage = transactions.pagination.hasNextPage ? page + 1 : null;
        transactions.pagination.prevPage = transactions.pagination.hasPrevPage ? page - 1 : null;

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};

const getTransactionsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status; // ambil status dari query
        const startDate = req.query.startDate; // ambil startDate dari query
        const endDate = req.query.endDate; // ambil endDate dari query
        const transactions = await transactionService.getTransactionsByUserId(userId, page, limit, status, startDate, endDate);

        transactions.pagination.hasNextPage = page < transactions.pagination.totalPages;
        transactions.pagination.hasPrevPage = page > 1;
        transactions.pagination.nextPage = transactions.pagination.hasNextPage ? page + 1 : null;
        transactions.pagination.prevPage = transactions.pagination.hasPrevPage ? page - 1 : null;

        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan", error: error.message });
    }
};

module.exports = {
    getAllTransactions,
    getTransactionsByUserId
};
