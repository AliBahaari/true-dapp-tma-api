import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IUserToken } from '../interfaces/user-token.interface';

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): IUserToken => {
  const request: Request = ctx.switchToHttp().getRequest();
  const user: IUserToken = request['user'];
  return user;
});
