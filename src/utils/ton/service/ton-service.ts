import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import { TransactionData } from "../interfaces/ton-transaction-detail.interface";
import axios, { AxiosResponse } from 'axios';
import { TraceData } from "../interfaces/ton-center-transaction-detail.interface";


@Injectable()
export class TonService{

    CHECK_TRANSACTION_URL="https://tonapi.io/v2/traces/"
    CHECK_TRANSACTION_URL_TON_CENTER="https://preview.toncenter.com/api/v3/traces?msg_hash="

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
            const data = await axios.get(`${this.CHECK_TRANSACTION_URL_TON_CENTER}${txId}`, { timeout: 5000 });
            const result: TraceData = data.data;
            return result;
        } catch (error) {
            throw new Error(`Failed to fetch transaction data: ${error.message}`);
        }
    }
    
    public async txIdIsValid(txId: string): Promise<boolean> {
        const maxRetries = 3; // Maximum number of retries
        let retryCount = 0;
    
        while (retryCount < maxRetries) {
            try {
                const transactionDetail = await this.checkTransaction(txId);
                // Validate the transaction data
                if (transactionDetail.transaction.aborted === false && transactionDetail.transaction.success === true) {
                    return true; // Transaction is valid
                } else {
                    throw new BadRequestException("Transaction ID is not VALID")
                }
            } catch (error) {
                retryCount++; // Increment retry count on error
                if (retryCount >= maxRetries) {
                    console.error(`Failed to fetch transaction data after ${maxRetries} retries: ${error.message}`);
                    return true; // Return true if API fails after retries
                }
                console.warn(`Retrying... Attempt ${retryCount} of ${maxRetries}`);
            }
        }
    
        return true; // Fallback return value
    }
}