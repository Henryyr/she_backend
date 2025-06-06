const dashboardController = require('./dashboardController');
const userController = require('./userController');
const bookingController = require('./bookingController');
const transactionController = require('./transactionController');
const productController = require('./productController');
const testimoniController = require('./testimoniController');
const voucherController = require('./voucherController')

module.exports = {
    ...dashboardController,
    ...userController,
    ...bookingController,
    ...transactionController,
    ...productController,
    ...testimoniController,
    ...voucherController
};
