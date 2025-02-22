import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { TransactionData } from "../interfaces/ton-transaction-detail.interface";
import axios, { AxiosResponse } from 'axios';
import { TraceData } from "../interfaces/ton-center-transaction-detail.interface";
import { AccountInfo } from "../interfaces/ton-account.interface";


@Injectable()
export class TonService implements OnModuleInit{
    async onModuleInit() {
        const isValid=await this.txIdIsValid("af1baacfd888e309ea406b919308a591faf43b0c6956f670d5dd6565c2f77075","UQCEX3wf3EkEUbYifjrtUTL3Sp1mE8x9OgTNcQ8JfahMEy7L")
    }


    CHECK_TRANSACTION_URL="https://tonapi.io/v2/traces/"
    CHECK_TRANSACTION_URL_TON_CENTER="https://preview.toncenter.com/api/v3/traces?msg_hash="
    FIND_ENCRYPTED_ADDRESS="https://tonapi.io/v2/accounts/"

    public async checkTransaction(txId: string): Promise<TransactionData> {
        try {
            const data = await axios.get(`${this.CHECK_TRANSACTION_URL}${txId}`, { timeout: 2000 });
            const result: TransactionData = data.data;
            return result;
        } catch (error) {
            throw new Error(`Failed to fetch transaction data: ${error.message}`);
        }
    }

    public async checkTransactionTonCenter(txId:string):Promise<TraceData>
    {
        try {
            const data = await axios.get(`${this.CHECK_TRANSACTION_URL_TON_CENTER}${txId}`, { timeout: 2000 });
            const result: TraceData = data.data;
            return result;
        } catch (error) {
            throw new Error(`Failed to fetch transaction data: ${error.message}`);
        }
    }
    
    public async checkAddress(address:string):Promise<AccountInfo>
    {
        try {
            const data = await axios.get(`${this.FIND_ENCRYPTED_ADDRESS}${address}`, { timeout: 2000 });
            const result: AccountInfo = data.data;
            return result;
        } catch (error) {
            throw new Error(`Failed to fetch wallet address: ${error.message}`);
        }
    }
    
    public async txIdIsValid(txId: string,address:string): Promise<boolean> {
        const maxRetries = 3; // Maximum number of retries
        let retryCount = 0;
    
        while (retryCount < maxRetries) {
            try {
                const currentTime=Math.floor(Date.now() / 1000); 
                const transactionDetail = await this.checkTransaction(txId);
                const walletAddressDetail=await this.checkAddress(address)
                const transactionTime=transactionDetail.transaction.utime
                const timeDifference=Math.abs(currentTime - transactionTime);
                // Validate the transaction data
                if (transactionDetail.transaction.aborted == false && 
                    transactionDetail.transaction.success == true && 
                    transactionDetail.transaction.account.address==walletAddressDetail.address && 
                    timeDifference <= 300 && 
                    transactionDetail.transaction.action_phase.skipped_actions==0) {
                    return true; // Transaction is valid
                } else {
                    return false
                }
            } catch (error) {
                retryCount++; // Increment retry count on error
                if (retryCount >= maxRetries) {
                    console.error(`Failed to fetch transaction data or wallet address after ${maxRetries} retries: ${error.message}`);
                    return true; // Return true if API fails after retries
                }
                console.warn(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
            }
        }
    
        return true; // Fallback return value
    }
}