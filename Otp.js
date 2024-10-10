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

        // HTML formatted email content
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; width: 400px; margin: 20px auto;">
            <h2 style="text-align: center; color: #333;">Your OTP Code</h2>
            <p style="font-size: 16px; color: #555; text-align: center;">
              Use the code below to complete your verification. This code is valid for 5 minutes.
            </p>
            <div style="text-align: center; padding: 20px;">
              <span style="display: inline-block; background-color: #007BFF; color: #fff; font-size: 24px; font-weight: bold; padding: 15px 30px; border-radius: 5px;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #999; text-align: center;">
              If you didn’t request this email, please ignore it.
            </p>
          </div>
        `;

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Your OTP Code',
            html: htmlContent, // Send HTML email
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