import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { KeyService } from 'src/key/key.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private keyService: KeyService) {}

  async use(req: Request, res: Response, next: () => void) {
    if (req.headers.authorization) {
      const keyComparison = await this.keyService.compare({
        key: req.headers.authorization,
      });
      if (!keyComparison) {
        res.status(401).send({ message: 'API Key Not Found' });
      } else {
        next();
      }
    } else {
      res.status(401).send({ message: 'Unauthorized' });
    }
  }
}
