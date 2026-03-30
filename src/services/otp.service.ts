import { prisma } from '../config/database';
import { AppError, NotFoundError } from '../utils/globalErrorHandler';
import { randomUUID } from 'crypto';

export class OTPService {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 5;
  private readonly ATTEMPT_RESET_MINUTES = 30;

  /**
   * Generate a random OTP
   */
  private generateOTP(): string {
    return Math.floor(Math.random() * Math.pow(10, this.OTP_LENGTH))
      .toString()
      .padStart(this.OTP_LENGTH, '0');
  }

  /**
   * Send OTP to user email (mock implementation - use email service in production)
   */
  async sendOTPToEmail(email: string, otp: string): Promise<void> {
    // In production, integrate with email service (SendGrid, Nodemailer, etc.)
    console.log(`📧 OTP for ${email}: ${otp}`);
    // TODO: Implement actual email sending
    // await emailService.send({
    //   to: email,
    //   subject: 'Your OTP for Movie Portal',
    //   template: 'otp',
    //   data: { otp }
    // });
  }

  /**
   * Generate and send OTP to user
   */
  async generateAndSendOTP(email: string): Promise<void> {
    const otp = this.generateOTP();
    const expiryTime = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Check if there are too many failed attempts
    const recentFailures = await prisma.verification.findMany({
      where: {
        identifier: email,
        createdAt: {
          gte: new Date(Date.now() - this.ATTEMPT_RESET_MINUTES * 60 * 1000),
        },
      },
    });

    if (recentFailures.length >= this.MAX_ATTEMPTS) {
      throw new AppError(429, 'Too many OTP attempts. Please try again later.');
    }

    // Delete any existing verification records for this email
    await prisma.verification.deleteMany({
      where: { identifier: email },
    });

    // Create new verification record
    await prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier: email,
        value: otp,
        expiresAt: expiryTime,
      },
    });

    // Send OTP to email
    await this.sendOTPToEmail(email, otp);
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const verification = await prisma.verification.findFirst({
      where: {
        identifier: email,
        value: otp,
      },
    });

    if (!verification) {
      throw new NotFoundError('Invalid OTP');
    }

    // Check if OTP is expired
    if (new Date() > verification.expiresAt) {
      // Delete expired OTP
      await prisma.verification.delete({
        where: { id: verification.id },
      });
      throw new AppError(400, 'OTP has expired. Please request a new one.');
    }

    // Mark as verified and delete OTP
    await prisma.verification.delete({
      where: { id: verification.id },
    });

    return true;
  }

  /**
   * Check if email is already verified
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user?.emailVerified ?? false;
  }

  /**
   * Mark email as verified
   */
  async markEmailAsVerified(email: string): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });
  }
}

export const otpService = new OTPService();
