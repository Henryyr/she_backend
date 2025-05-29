const userService = require('./admin/userService');
const bookingService = require('./admin/bookingService');
const transactionService = require('./admin/transactionService');
const dashboardService = require('./admin/dashboardService');
const productService = require('./admin/productService'); 

module.exports = {
    ...userService,
    ...bookingService,
    ...transactionService,
    ...dashboardService,
    ...productService,
}