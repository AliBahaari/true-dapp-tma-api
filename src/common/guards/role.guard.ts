import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorator/role.decorator';



@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<number[]>(ROLES_KEY, context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const user = request['user'];
        if (!user || !user.roles) {
            throw new UnauthorizedException('unAuthenticated');
        }

        const hasRole = user.roles.some((role: number) => requiredRoles.includes(Number(role)));
        if (!hasRole) {
            throw new ForbiddenException('Forbidden');
        }

        return true;
    }
}
