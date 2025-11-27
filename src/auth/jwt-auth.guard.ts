// src/auth/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Missing Authorization header');

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) throw new UnauthorizedException('Invalid token format');

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret');
      request.user = payload; // voit hakea tästä userId ja username
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
