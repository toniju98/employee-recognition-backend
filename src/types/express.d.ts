import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  kauth?: {
    grant?: {
      access_token: {
        content: {
          sub: string;
          email: string;
          given_name: string;
          family_name: string;
          realm_access?: {
            roles: string[];
          };
        };
      };
    };
  };
} 