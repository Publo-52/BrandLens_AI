import admin from '../config/firebaseAdmin.js';
import { User } from '../modules/auth/user.model.js';
import { Membership } from '../modules/members/membership.model.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Missing Authorization Bearer token', statusCode: 401 },
      });
    }

    const idToken = authHeader.split('Bearer ')[1].trim();
    let decoded = null;

    // 1. Attempt verification with Firebase Admin SDK
    try {
      if (admin.apps.length) {
        decoded = await admin.auth().verifyIdToken(idToken);
      }
    } catch (fbErr) {
      logger.debug(`Firebase verifyIdToken failed: ${fbErr.message}. Checking fallback tokens.`);
    }

    // 2. Fallback: Check if it's a signed JWT (HS256 algorithm pinned to prevent algorithm confusion)
    if (!decoded) {
      try {
        const jwtPayload = jwt.verify(idToken, config.jwtSecret, { algorithms: ['HS256'] });
        if (jwtPayload?.userId) {
          const existingUser = await User.findById(jwtPayload.userId);
          if (existingUser) {
            if (existingUser.isActive === false) {
              return res.status(403).json({
                success: false,
                error: { message: 'Account is deactivated. Please contact an administrator.', statusCode: 403 },
              });
            }
            decoded = {
              uid: existingUser.firebaseUid || existingUser._id.toString(),
              email: existingUser.email,
              name: existingUser.name,
              picture: existingUser.avatarUrl || '',
            };
          }
        } else if (jwtPayload?.email) {
          decoded = {
            uid: jwtPayload.uid || `demo_${jwtPayload.email}`,
            email: jwtPayload.email,
            name: jwtPayload.name || jwtPayload.email.split('@')[0],
            picture: '',
          };
        }
      } catch (jwtErr) {
        // Not a fallback JWT
      }
    }

    // 3. Fallback: Demo token format restricted strictly to non-production / opt-in demo domains
    if (!decoded && idToken.startsWith('demo:') && config.allowDemoAuth) {
      const demoEmail = idToken.slice(5).toLowerCase().trim();
      const allowedDemoDomains = ['@novatech.demo', '@rbac-test.local', '@brandlens.local', '@test.local'];
      const isAllowedDemoEmail = allowedDemoDomains.some((domain) => demoEmail.endsWith(domain));
      if (isAllowedDemoEmail && /^\S+@\S+\.\S+$/.test(demoEmail)) {
        decoded = {
          uid: `demo_${demoEmail.replace(/[^a-z0-9]/g, '_')}`,
          email: demoEmail,
          name: demoEmail.split('@')[0].toUpperCase(),
          picture: '',
        };
      }
    }

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired Firebase authentication token', statusCode: 401 },
      });
    }

    const email = (decoded.email || '').toLowerCase().trim();

    // 4. Upsert user in MongoDB
    let user = null;
    if (decoded.uid) {
      user = await User.findOne({ firebaseUid: decoded.uid });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid || `fb_${Date.now()}`,
        email: email || `user_${Date.now()}@brandlens.ai`,
        name: decoded.name || email.split('@')[0] || 'User',
        avatarUrl: decoded.picture || '',
      });
    } else {
      let updated = false;
      if (!user.firebaseUid && decoded.uid) {
        user.firebaseUid = decoded.uid;
        updated = true;
      }
      if (decoded.picture && user.avatarUrl !== decoded.picture) {
        user.avatarUrl = decoded.picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error: { message: 'Account is deactivated. Please contact an administrator.', statusCode: 403 },
      });
    }

    // 5. Auto-activate any pending workspace invites for this email
    if (email) {
      await Membership.updateMany(
        { invitedEmail: email, status: 'INVITED' },
        { $set: { userId: user._id, status: 'ACTIVE' } }
      );
    }

    req.user = user;
    req.firebaseUser = decoded;
    next();
  } catch (err) {
    logger.error('verifyFirebaseToken error:', err);
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication verification failed', statusCode: 401 },
    });
  }
}

export default verifyFirebaseToken;
