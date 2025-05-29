const dashboardController = require('./dashboardController');
const userController = require('./userController');
const bookingController = require('./bookingController');
const transactionController = require('./transactionController');
const productController = require('./productController');

module.exports = {
    ...dashboardController,
    ...userController,
    ...bookingController,
    ...transactionController,
    ...productController
};
