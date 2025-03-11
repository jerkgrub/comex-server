const crypto = require('crypto');
const nodemailer = require('nodemailer');

const otpStore = {};

class Otp {
  static generateOtp(email) {
    console.log('[DEBUG] Generating OTP for email:', email);
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresIn = Date.now() + 5 * 60 * 1000;

    otpStore[email] = { otp, expiresIn };
    console.log('[DEBUG] OTP generated and stored for email:', email);
    console.log('[DEBUG] Current OTP store:', JSON.stringify(otpStore));
    return otp;
  }

  static validateOtp(email, otp) {
    console.log('[DEBUG] Validating OTP for email:', email, 'OTP:', otp);
    console.log('[DEBUG] Current OTP store:', JSON.stringify(otpStore));

    const record = otpStore[email];
    if (!record) {
      console.log('[DEBUG] No OTP record found for email:', email);
      return false;
    }

    const { otp: storedOtp, expiresIn } = record;
    console.log('[DEBUG] Stored OTP:', storedOtp, 'Expires at:', new Date(expiresIn).toISOString());
    console.log('[DEBUG] Current time:', new Date().toISOString());

    if (storedOtp === otp && Date.now() < expiresIn) {
      console.log('[DEBUG] OTP validation successful for email:', email);
      delete otpStore[email]; // Invalidate OTP after use
      return true;
    }

    console.log('[DEBUG] OTP validation failed for email:', email);
    return false;
  }

  static validateEmail(email) {
    console.log('[DEBUG] Validating email format:', email);

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.log('[DEBUG] Invalid email format:', email);
      return false;
    }

    // Domain-specific validation
    if (!email.endsWith('nu-moa.edu.ph')) {
      console.log('[DEBUG] Invalid email domain, must end with nu-moa.edu.ph:', email);
      return false;
    }

    console.log('[DEBUG] Email validation passed for:', email);
    return true;
  }

  static async sendOtp(email) {
    console.log('[DEBUG] Sending OTP to email:', email);

    // Validate email before sending OTP
    if (!this.validateEmail(email)) {
      console.log('[DEBUG] Email validation failed, not sending OTP');
      throw new Error('Invalid email format or domain');
    }

    try {
      const otp = this.generateOtp(email);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER, // Use environment variables
          pass: process.env.GMAIL_PASS
        }
      });

      console.log('[DEBUG] Nodemailer transporter created with user:', process.env.GMAIL_USER);

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
                  If you didn't request this email, please ignore it.
                </p>
              </div>
            `;

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        html: htmlContent // Send HTML email
      };

      console.log(
        '[DEBUG] Sending email with options:',
        JSON.stringify({
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject
        })
      );

      const info = await transporter.sendMail(mailOptions);
      console.log('[DEBUG] Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('[DEBUG] Error sending OTP email:', error);
      throw error;
    }
  }

  static checkOtpExpired(email) {
    console.log('[DEBUG] Checking if OTP expired for email:', email);
    const record = otpStore[email];
    if (!record || Date.now() > record.expiresIn) {
      console.log('[DEBUG] OTP expired or not found for email:', email);
      delete otpStore[email]; // Remove expired OTP
      return false;
    }
    console.log('[DEBUG] OTP still valid for email:', email);
    return true;
  }
}

module.exports = Otp;
