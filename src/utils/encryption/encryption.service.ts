import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly secretKey = process.env.ENCRYPTION_KEY
  
  
  constructor() {
    console.log(this.decrypt("U2FsdGVkX18WHq/SGFrDvzrqjaU9jQ2A022NsLpoKaSg01H2KGRNHwEL+1NUKvjwYK2gDE0r7iTIXzoBB6fD2YvU741PpNzuC1XNN07GaajMUBtS632FoX4t2GtKUltt"))
  }
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
