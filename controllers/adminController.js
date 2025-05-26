const dashboardController = require('./admin/dashboardController');
const userController = require('./admin/userController');
const bookingController = require('./admin/bookingController');
const transactionController = require('./admin/transactionController');
const productController = require('./admin/productController'); // tambahkan baris ini

module.exports = {
    ...dashboardController,
    ...userController,
    ...bookingController,
    ...transactionController,
    ...productController // tambahkan baris ini
};
