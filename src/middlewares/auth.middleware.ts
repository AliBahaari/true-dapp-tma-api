import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ExceptionMessageEnum } from 'src/common/enum/exception-messages.enum';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async use(req: Request, res: Response, next: () => void) {
    if (req.headers.authorization) {
      console.log(req.headers.authorization)
      const secretCodeComparison = await this.usersService.compareBySecretCode(
        req.headers.authorization,
      );
      if (!secretCodeComparison) {
        console.log("------ im here --------")
        throw new UnauthorizedException(ExceptionMessageEnum.AUTHORIZATION_IS_WRONG);
      } else {

        if(secretCodeComparison.isBanned==true)
        throw new UnauthorizedException(ExceptionMessageEnum.USER_IS_BANNED);

        next();
      }
    } else {
      throw new UnauthorizedException(ExceptionMessageEnum.UN_AUTHORIZED);
    }
  }
}
