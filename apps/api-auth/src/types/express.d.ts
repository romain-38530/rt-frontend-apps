import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        logisticianId?: string;
        industrialId?: string;
        companyName?: string;
        name?: string;
        email?: string;
        portal?: string;
      };
    }
  }
}

export {};
