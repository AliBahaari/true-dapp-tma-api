import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerService } from 'src/logger/service/logger.service';
import { IUserToken } from '../interfaces/user-token.interface';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
    constructor(private readonly loggerService: LoggerService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, headers, params, query, body } = req;
        const user: IUserToken = req['user']
        res.on('finish', async () => {
            const statusCode = res.statusCode;

            await this.loggerService.create({
                method,
                url: originalUrl,
                headers,
                params,
                query,
                body,
                statusCode,
                initData: user?.initData,
                userId: user?.id,
                roles: user?.roles?.join(','),
                secretCode: user?.secretCode,
            });
        });

        next();
    }
}
