const crypto = require('crypto');
const nodemailer = require('nodemailer');

const otpStore = {};

class Otp {
    static generateOtp(email) {
        const otp = crypto.randomInt(100000, 999999).toString();
        const expiresIn = Date.now() + 5 * 60 * 1000;

        otpStore[email] = { otp, expiresIn };
        return otp;
    }

    static validateOtp(email, otp) {
        const record = otpStore[email];
        if (!record) return false;

        const { otp: storedOtp, expiresIn } = record;

        if (storedOtp === otp && Date.now() < expiresIn) {
            delete otpStore[email]; // Invalidate OTP after use
            return true;
        }

        return false;
    }

    static async sendOtp(email) {
        const otp = this.generateOtp(email);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER, // Use environment variables
                pass: process.env.GMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        });
    }

    static checkOtpExpired(email) {
        const record = otpStore[email];
        if (!record || Date.now() > record.expiresIn) {
            delete otpStore[email]; // Remove expired OTP
            return false;
        }
        return true;
    }
}

module.exports = Otp;