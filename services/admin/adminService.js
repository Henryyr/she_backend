const userService = require('./userService');
const bookingService = require('./bookingService');
const transactionService = require('./transactionService');
const dashboardService = require('./dashboardService');
const productService = require('./productService'); 

module.exports = {
    ...userService,
    ...bookingService,
    ...transactionService,
    ...dashboardService,
    ...productService,
}