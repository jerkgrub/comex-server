const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const otpStore = {};

class ChangePasswordOtp {
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
            delete otpStore[email];
            return true;
        }

        return false;
    }

    static async sendOtp(email) {
        const otp = this.generateOtp(email);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'your-email@gmail.com',
                pass: 'your-email-password',
            },
        });

        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Your OTP Code for Password Change',
            text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        });
    }

    static async changePassword(email, otp, newPassword) {
        if (!this.validateOtp(email, otp)) {
            throw new Error('Invalid or expired OTP');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        delete otpStore[email];

        return { message: 'Password changed successfully!' };
    }
}

module.exports = ChangePasswordOtp;
