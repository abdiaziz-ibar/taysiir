// Generates a 6-digit numeric OTP code, e.g. "042613"
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

module.exports = generateOtp;
