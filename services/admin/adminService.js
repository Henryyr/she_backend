const userService = require('./userService');
const bookingService = require('./bookingService');
const transactionService = require('./transactionService');
const dashboardService = require('./dashboardService');
const productService = require('./productService'); 
const testimoniService = require('./testimoniService');
const voucherService = require('./voucherService');
const layananService = require('./layananService');
const kategoriService = require('./kategoriService');

module.exports = {
    ...userService,
    ...bookingService,
    ...transactionService,
    ...dashboardService,
    ...productService,
    ...testimoniService,
    ...voucherService,
    ...layananService,
    ...kategoriService
}