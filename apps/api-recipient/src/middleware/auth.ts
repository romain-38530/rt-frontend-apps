import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    recipientId: string;
    email: string;
    role: string;
    type: 'recipient' | 'contact';
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;

    req.user = {
      id: decoded.id,
      recipientId: decoded.recipientId,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type || 'recipient'
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRecipient = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.type !== 'recipient' && req.user.type !== 'contact') {
    res.status(403).json({ error: 'Recipient access required' });
    return;
  }

  next();
};

export const requireActiveRecipient = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const { Recipient } = await import('../models/Recipient');
    const recipient = await Recipient.findOne({ recipientId: req.user.recipientId });

    if (!recipient) {
      res.status(404).json({ error: 'Recipient not found' });
      return;
    }

    if (recipient.status !== 'active') {
      res.status(403).json({
        error: 'Recipient account is not active',
        status: recipient.status
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error verifying recipient status' });
  }
};
