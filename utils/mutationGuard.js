import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { secretKey } from '@/config/jwtConfig';

export const TEST_USER_EMAIL = 'test@gmail.com';

/**
 * Checks if a request originates from the test user (test@gmail.com).
 * Evaluates headers (x-user-email, Authorization JWT) and optional payload.
 */
export function isTestUserRequest(req) {
  try {
    if (!req) return false;

    // 1. Check custom header x-user-email
    const userEmailHeader = req.headers?.get ? req.headers.get('x-user-email') : req.headers?.['x-user-email'];
    if (userEmailHeader && userEmailHeader.trim().toLowerCase() === TEST_USER_EMAIL) {
      return true;
    }

    // 2. Check Authorization Bearer token
    const authHeader = req.headers?.get ? req.headers.get('authorization') || req.headers.get('Authorization') : (req.headers?.authorization || req.headers?.Authorization);
    if (authHeader) {
      const parts = authHeader.split(' ');
      const token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : (parts.length === 1 ? parts[0] : null);
      if (token) {
        try {
          const decoded = jwt.decode(token);
          if (decoded && (decoded.email || decoded.EMAIL)) {
            const email = (decoded.email || decoded.EMAIL).trim().toLowerCase();
            if (email === TEST_USER_EMAIL) {
              return true;
            }
          }
        } catch (e) {
          // Ignore decoding errors
        }
      }
    }
  } catch (err) {
    console.error('[MUTATION_GUARD] Error checking test user:', err);
  }

  return false;
}

/**
 * Helper to block mutations for test user.
 * Returns a 403 Forbidden NextResponse if test user, or null if allowed.
 */
export function protectMutation(req) {
  if (isTestUserRequest(req)) {
    return NextResponse.json(
      {
        error: 'Action restricted: Test account (test@gmail.com) has View-Only access across the teacher panel.',
        isTestUserRestricted: true
      },
      { status: 403 }
    );
  }
  return null;
}
