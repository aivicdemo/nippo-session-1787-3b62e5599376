import { APIGatewayProxyEvent } from 'aws-lambda';

export type Role = 'admin' | 'operator' | 'viewer';

export interface AuthContext {
  userId: string;
  role: Role;
  teamIds: string[];
}

export function extractAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authHeader = event.headers['Authorization'] || '';
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Missing authorization token');
  }
  
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return {
      userId: decoded.userId,
      role: decoded.role as Role,
      teamIds: decoded.teamIds || []
    };
  } catch (error) {
    throw new Error('Invalid authorization token');
  }
}

export function requireRole(context: AuthContext, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(context.role)) {
    throw new ForbiddenError(`Role ${context.role} is not allowed for this operation`);
  }
}

export function requireAnyRole(context: AuthContext, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(context.role);
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}