import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ExceptionMessageEnum } from 'src/common/enum/exception-messages.enum';
import { IUserToken } from 'src/common/interfaces/user-token.interface';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(req: Request, res: Response, next: () => void) {
    if (req.headers.authorization) {
      const secretCodeComparison = await this.usersService.compareBySecretCode(
        req.headers.authorization,
      );
      if (!secretCodeComparison) {
        throw new UnauthorizedException(ExceptionMessageEnum.AUTHORIZATION_IS_WRONG);
      } else {
        if(secretCodeComparison.isBanned==true)
        throw new UnauthorizedException(ExceptionMessageEnum.USER_IS_BANNED);

        
        const decodedUser:IUserToken={
          id:secretCodeComparison.id,
          initData:secretCodeComparison.initData,
          roles:secretCodeComparison.roles.map(x=>Number(x)),
          secretCode:secretCodeComparison.secretCode
        }

        req["user"]=decodedUser
        next();
      }
    } else {
      throw new UnauthorizedException(ExceptionMessageEnum.UN_AUTHORIZED);
    }
  }
}
