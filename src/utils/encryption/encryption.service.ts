import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

@Injectable()
export class EncryptionService {
  private readonly secretKey = process.env.ENCRYPTION_KEY
  
  
  constructor() {
    // console.log(this.decrypt("U2FsdGVkX19qowZNrCSkLA2jPJ2W5BNhUrVlpMRkI0J1qBxrhTusEJuWIwUbm5Drl8saM+ZEdclmPnWBtzPoOmjvdZncjowppgM+67AYd/5+Th1bumuhzGAhe3/ZBnB8pixrrsaRrNqq+prrKhxlZudSSQgFr2rEOlnXXkgcIfXAoxVJgRnDg1dLutNgnTxug+gBJTM0Dkaw+6IDTw4W3CRPkUCiIqc2cgM7o2r98WuCucU4X9GvH3nSybrvAxL2wUKIlksJTiY/+3Kpxyzm860WNMwHFTGxqkdUI3cEh+koFrdFYN5fYC3XIcwI8wYlO/Wcwtxld9VVKQ2SL19NxRXl6oM+6n0AiAXD+TqcUvmIYGrAg8l4leiNL19DK9EuKNh2QZHebJTPqpxayGnvU2nSZFrhcBBxfEoe672kIw5Wp8qPiuqdvbR07OFRAC58G2F3n3RFOjCW7K2ClAhk1F8qVJUFJ6CCFmYP7PqhqNGL+yqfdxhRBLJWvz0+GBkEEAnXoUIIdt5/9Lnt75/hR47GsL6Knk+BLkxYNuqfzZiVc7Bnued10xYlJz6MRvFa381ivaUE2aTjbW93/pyuxTvekoYJrfc8W27MzrJyUbLMWGelKZ7Wr+wVBWCeDiG+zWKn2YZDwteMKVGskkY+OHwgOEEgpzkpW8dcp+/tsVl7N68WePl1218AHegCrFDVfcD9mPYUNhBfJfiE+IuDs3uaAk7fg2fSJc593e5V0HzEAbn5CGdE58vOiyen0GhuYvxN++LbY/bvsAu47pTSQjTcWgjPmwUWulSNTLs+06dYTVLrKhahJJgN+ZLFi/lBtp/ueDCGfUNepH/WBrf1VJREjMiN5rYAmuuAFcaHYgpMRaUV5RutaLpL0gIkg6B04nQ+3tgd56/JXjQuuKMWzI4Ss1NjcAjeY0YYgT9ClIWzsxOKUGTKpdgEULsiPDmYZb3nMB319CqqTYGa6dKpo7oerHCPJiaaD+h+JYGWVCVMp15j6ntxKz+DP5g1j9aBq6PhB3W6trQL5zL/GrXK/KeMZWbg6dFA1uLbeZGq0z1Yb9wHrUnWDbyQ70pKy9jTLwZ5SbxcqYEVCvncpTlpBHBXnYO9Yso4JDswSP0OJTC9SRKTXx4YX/U/AyKR83bcEHORR2P7+39So36NcOXiFlKWwmOyIsw2KQsLDC/uNRlYyjhVfq6MuwBSRy5UAqCw0/gr5tggoEo21V340diZ+vIuuIxsh48AQm7vJgAr0QVbIgVMWCBUtu/Q6H7t2AoZu+3WnHd6WkI6tzchVELuYuQK8atRKwk/pSJATFB7oEQcYJXiQLa3QnFO9goR46GWdV7jKNv8CIB8ZJPPzkr4Cb8opck7IF+DZuRKV+6hwjxGEBaCddQ/XeQ8ZspLCHae"))
  }
  encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.secretKey).toString();
  }

  decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
