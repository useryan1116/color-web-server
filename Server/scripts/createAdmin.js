const args = process.argv.slice(2);
if (args.includes('--local') && !process.env.MONGODB_URI) process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/survey_db';

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const normalizeEmail = value => String(value || '').trim().toLowerCase();

async function createAdmin() {
    const email = normalizeEmail(process.env.ADMIN_EMAIL);
    const password = process.env.ADMIN_PASSWORD || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || Buffer.byteLength(password) < 12 || Buffer.byteLength(password) > 72) {
        throw new Error('ADMIN_EMAIL and a 12-72 byte ADMIN_PASSWORD are required');
    }
    await connectDB();
    if (await Admin.findOne({ email })) throw new Error('Administrator already exists; use the profile or password-reset flow');
    await new Admin({ email, password, name: String(process.env.ADMIN_NAME || '').trim(), department: String(process.env.ADMIN_DEPARTMENT || '').trim() }).save();
    console.log(`Administrator created: ${email}`);
}

createAdmin().then(() => mongoose.disconnect()).catch(async error => {
    console.error(`Administrator creation failed: ${error.message}`);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});
