import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class BannedUserGuard implements CanActivate {
  public constructor(private readonly userService?: UsersService) {}
  /**
   * Determines whether the route is public or requires authentication.
   * @param context The execution context.
   * @returns A boolean indicating whether the route can be accessed without authentication.
   */
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    try {
      if (!request.headers?.authorization)
        throw new BadRequestException('UnAuthorized');

      const userSecretCode = request.headers.authorization;
      const checkUserBannedStatus = await this.userService.userBannedStatus(
        userSecretCode,
      );

      if (checkUserBannedStatus)
        throw new BadRequestException('User is Banned.');

      return true;
    } catch (error) {
      throw new BadRequestException('UnAuthorized');
    }
  }
}
