import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorator/public-api.decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService, private reflector: Reflector) { }

    public canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractToken(request);
        if (!token) {
            throw new UnauthorizedException('Token Does Not Exist');
        }

        try {
            const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
            request["user"] = payload;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Token Is Invalid');
        }
    }

    private extractToken(request: Request): string | null {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }
}