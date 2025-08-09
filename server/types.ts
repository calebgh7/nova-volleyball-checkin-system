import express from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      role: 'admin' | 'staff';
    };
  }
}

export interface AuthenticatedRequest extends express.Request {
  user: {
    userId: string;
    role: 'admin' | 'staff';
  };
}
