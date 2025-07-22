// utils/timeChecker.js
const moment = require('moment-timezone');

function checkServerTimeZone () {
  const now = moment();
  const makassarTime = now.tz('Asia/Makassar');

  console.log(`🕒 Server local time: ${now.format()}`);
  console.log(`🕒 Asia/Makassar time: ${makassarTime.format()}`);

  if (now.utcOffset() !== makassarTime.utcOffset()) {
    console.warn('⚠️ Warning: Server timezone is NOT Asia/Makassar');
  } else {
    console.log('✅ Server timezone matches Asia/Makassar');
  }
}

module.exports = checkServerTimeZone;
