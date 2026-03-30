import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate.middleware';
import { otpService } from '../services/otp.service';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

// Validation schemas
const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
}).strict();

const otpVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
}).strict();

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to user email for signup/verification
 */
router.post(
  '/auth/send-otp',
  validate({ body: emailSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Check if email is already verified
    const isVerified = await otpService.isEmailVerified(email);
    if (isVerified) {
      return sendSuccess(res, { message: 'Email is already verified' });
    }

    // Generate and send OTP
    await otpService.generateAndSendOTP(email);

    sendSuccess(res, {
      message: 'OTP sent to your email',
      email,
      expiresIn: '10 minutes',
    });
  }),
);

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and mark email as verified
 */
router.post(
  '/auth/verify-otp',
  validate({ body: otpVerificationSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    // Verify OTP
    await otpService.verifyOTP(email, otp);

    // Check if user exists and mark email as verified
    sendSuccess(res, {
      message: 'OTP verified successfully',
      email,
      verified: true,
    });
  }),
);

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP to user email
 */
router.post(
  '/auth/resend-otp',
  validate({ body: emailSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    // Generate and send new OTP
    await otpService.generateAndSendOTP(email);

    sendSuccess(res, {
      message: 'OTP resent to your email',
      email,
      expiresIn: '10 minutes',
    });
  }),
);

export default router;
