import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
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
        res.status(401).send({ message: 'Authorization Is Wrong' });
      } else {

        if(secretCodeComparison.isBanned==true)
        res.status(401).send({ message: 'User Is Banned.' });

        next();
      }
    } else {
      res.status(401).send({ message: 'Unauthorized' });
    }
  }
}
