import { Request, Response, NextFunction } from 'express';
import { keycloak } from '../config/keycloak';

export const hasRole = (requiredRole: string) => {
  return keycloak.protect((token: any) => {
    const realmRoles = token.content.realm_access?.roles || [];
    return realmRoles.includes(requiredRole);
  });
};

export const isAdmin = hasRole('admin');
export const isManager = hasRole('manager');
export const isEmployee = hasRole('employee');