import jwt from 'jsonwebtoken';
import { config } from '../config';
import { dbStore } from '../models/store';
import { IUser, UserRole } from '../models/types';

export interface TokenPayload {
  userId: string;
  mobile: string;
  role: UserRole;
  languagePreference: string;
}

export class AuthService {
  static generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      languagePreference: user.languagePreference
    };
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '24h'
    });
  }

  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    } catch (err) {
      throw new Error("Invalid or expired session token");
    }
  }

  static getOrCreateUserByMobile(mobile: string, defaultLanguage: string = 'hi'): IUser {
    const cleanedMobile = mobile.replace(/\D/g, '').slice(-10);
    let user = dbStore.findUserByMobile(cleanedMobile);

    if (!user) {
      // Determine if mobile matches initial officer config
      const isOfficer = cleanedMobile === config.INITIAL_OFFICER_MOBILE;
      user = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        mobile: cleanedMobile,
        role: isOfficer ? 'officer' : 'pensioner',
        languagePreference: defaultLanguage,
        createdAt: new Date().toISOString()
      };
      dbStore.saveUser(user);
    }

    return user;
  }
}
