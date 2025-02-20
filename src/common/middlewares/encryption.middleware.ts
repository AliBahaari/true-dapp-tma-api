import { Injectable, NestMiddleware, Param } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { EncryptionService } from 'src/utils/encryption/encryption.service';

@Injectable()
export class EncryptionMiddleware implements NestMiddleware {
  constructor(private readonly encryptionService: EncryptionService) {  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Decrypt request body
    if (req.body && req.body.data) {
      const decryptedBody = await this.encryptionService.decrypt(req.body.data);
      req.body = JSON.parse(decryptedBody);
    }

    // Decrypt query parameters (if needed)
    if (req.query) {
      for (const key in req.query) {
        if (req.query.hasOwnProperty(key) && typeof req.query[key] === 'string') {
          req.query[key] =  this.encryptionService.decrypt(req.query[key] as string);
        }
      }
    }

    const encryptService: EncryptionService = this.encryptionService;
    const oldSend = res.send;
  
    res.send = function (data) {
      let encryptedResponse
      // Modify the response body
      if(data==undefined || null || !data)
      {
        console.log("----- im here --------")
        console.log(data)
         encryptedResponse = encryptService.encrypt("true");  
      }else{
        encryptedResponse = encryptService.encrypt(data);  
      }
      
      // Ensure the encrypted response is sent as a string
      oldSend.call(this, JSON.stringify({ data: encryptedResponse }));
  
      return this;
    };

    next();
  }

  public extractParams(param:string):string[]{
    const matches = param.match(/{(.*?)}/g).map(match => match.slice(1, -1));
        return matches
  }
}


