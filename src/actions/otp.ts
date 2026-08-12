"use server";

import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import twilio from "twilio";

// Send Email and SMS OTP
export async function sendOtp(email: string, phoneNumber: string) {
  // Validate presence of credentials in .env
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!smtpUser || !smtpPass) {
    throw new Error("Gmail SMTP credentials (SMTP_USER & SMTP_PASSWORD) are not configured in .env.");
  }
  if (!twilioSid || !twilioAuthToken || !twilioPhone) {
    throw new Error("Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN & TWILIO_PHONE_NUMBER) are not configured in .env.");
  }

  // Generate 4-digit codes
  const emailCode = Math.floor(1000 + Math.random() * 9000).toString();
  const phoneCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Clear any existing verification codes for this target
  await prisma.otpVerification.deleteMany({
    where: { email, phone: phoneNumber },
  });

  // Save new OTP code record in database
  await prisma.otpVerification.create({
    data: {
      email,
      phone: phoneNumber,
      emailOtp: emailCode,
      phoneOtp: phoneCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
    },
  });

  // 1. Send Email OTP using Nodemailer (Gmail SMTP)
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"Kathuria Gun House Support" <${smtpUser}>`,
      to: email,
      subject: "Your KGH Verification Code",
      text: `Your KGH verification code is: ${emailCode}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #fff; padding: 20px; border-radius: 12px; border: 1px solid #333; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #ff3333; text-align: center; border-bottom: 1px solid #333; padding-bottom: 10px;">Kathuria Gun House</h2>
          <p style="font-size: 16px;">Hello,</p>
          <p style="font-size: 14px; color: #ccc; line-height: 1.5;">Please use the following 4-digit verification code to complete your security verification process. This code will expire in 10 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #ff3333; letter-spacing: 5px; background-color: #222; padding: 10px 20px; border-radius: 8px; border: 1px solid #444;">
              ${emailCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #666; text-align: center; border-top: 1px solid #222; padding-top: 15px;">If you did not request this verification code, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Nodemailer error:", err);
    throw new Error("Failed to send OTP to email. Please verify your email configuration.");
  }

  // 2. Send SMS OTP using Twilio
  try {
    const client = twilio(twilioSid, twilioAuthToken);
    
    // Format phone number to E.164 format if needed (+91...)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      // Assuming India country code +91 as default if length is 10 digits
      if (formattedPhone.length === 10) {
        formattedPhone = "+91" + formattedPhone;
      } else {
        formattedPhone = "+" + formattedPhone;
      }
    }

    await client.messages.create({
      body: `Your KGH mobile verification code is: ${phoneCode}. Valid for 10 minutes.`,
      from: twilioPhone,
      to: formattedPhone,
    });
  } catch (err) {
    console.error("Twilio error:", err);
    throw new Error("Failed to send OTP to phone number. Please verify your mobile number or Twilio config.");
  }

  return { success: true };
}

// Verify Email and SMS OTP
export async function verifyOtp(email: string, phoneNumber: string, emailCode: string, phoneCode: string) {
  const verification = await prisma.otpVerification.findFirst({
    where: {
      email,
      phone: phoneNumber,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    throw new Error("No active verification code found. Please request a new OTP.");
  }

  // Check expiry
  if (new Date() > new Date(verification.expiresAt)) {
    // Delete expired record
    await prisma.otpVerification.delete({ where: { id: verification.id } });
    throw new Error("OTP codes have expired. Please request a new OTP.");
  }

  // Verify codes
  if (verification.emailOtp !== emailCode) {
    throw new Error("Invalid Email OTP code.");
  }

  if (verification.phoneOtp !== phoneCode) {
    throw new Error("Invalid Phone OTP code.");
  }

  // On successful verification, delete the record so it can't be reused
  await prisma.otpVerification.delete({ where: { id: verification.id } });

  return { success: true };
}
