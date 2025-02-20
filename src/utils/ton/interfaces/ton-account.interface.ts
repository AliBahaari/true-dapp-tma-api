export interface AccountInfo {
    address: string;
    balance: number;
    last_activity: number;
    status: string;
    interfaces: string[];
    get_methods: string[];
    is_wallet: boolean;
}