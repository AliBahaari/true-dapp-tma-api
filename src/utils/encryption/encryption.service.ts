import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly secretKey = process.env.ENCRYPTION_KEY


  constructor() {
    console.log(this.decrypt("U2FsdGVkX198QhMUlYS2GSisaUS2cZ1mRaJpqFsNdEtjuRA1PRu5mCgkXsc1twZ/At2jlAIOqq9OqWQBdCg4b158Nt7t5CArZ47konN3wLs="))
  }
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
