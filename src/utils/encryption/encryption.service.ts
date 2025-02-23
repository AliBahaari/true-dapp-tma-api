import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly secretKey = process.env.ENCRYPTION_KEY


  constructor() {
    console.log(JSON.parse(this.decrypt("U2FsdGVkX18Y3gYnj1Hv2SNcBHqdI6DImGDMJ+HyDGkNtRrAyzAvIYwuJxAAxiiIjPfuhInvXXwQVZwW1v+RRnBUjcaiVnmNKsgyY7/ro5+ndb7KD8PvTibjnU5O9u7a")))
  }
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
