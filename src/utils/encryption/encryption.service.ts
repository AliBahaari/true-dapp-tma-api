import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly secretKey = process.env.ENCRYPTION_KEY
// constructor(){
//   const mamad=this.decrypt("U2FsdGVkX1+zPAhKGLJUe5iL8QrIblhvR0YYjRsZJbk=")
//   console.log("------ decrypt ")
//   console.log(mamad)
// }
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
