export interface Transaction {
    hash: string;
    lt: number;
    account: Account;
    success: boolean;
    utime: number;
    orig_status: string;
    end_status: string;
    total_fees: number;
    end_balance: number;
    transaction_type: string;
    state_update_old: string;
    state_update_new: string;
    in_msg: InMsg;
    out_msgs: any[]; // Assuming out_msgs is an array of similar messages or empty
    block: string;
    prev_trans_hash: string;
    prev_trans_lt: number;
    compute_phase: ComputePhase;
    storage_phase: StoragePhase;
    action_phase: ActionPhase;
    aborted: boolean;
    destroyed: boolean;
    raw: string;
  }
  
  export interface Account {
    address: string;
    is_scam: boolean;
    is_wallet: boolean;
  }
  
  export interface InMsg {
    msg_type: string;
    created_lt: number;
    ihr_disabled: boolean;
    bounce: boolean;
    bounced: boolean;
    value: number;
    fwd_fee: number;
    ihr_fee: number;
    destination: Account;
    import_fee: number;
    created_at: number;
    op_code: string;
    hash: string;
    raw_body: string;
    decoded_op_name: string;
    decoded_body: DecodedBody;
  }
  
  export interface DecodedBody {
    wallet_id: number;
    valid_until: number;
    seqno: number;
    actions: Action[];
    extended: null;
    signature: string;
  }
  
  export interface Action {
    magic: string;
    mode: number;
    msg: Msg;
  }
  
  export interface Msg {
    sum_type: string;
    message_internal: MessageInternal;
  }
  
  export interface MessageInternal {
    ihr_disabled: boolean;
    bounce: boolean;
    bounced: boolean;
    src: string;
    dest: string;
    value: Value;
    ihr_fee: string;
    fwd_fee: string;
    created_lt: number;
    created_at: number;
    init: null;
    body: Body;
  }
  
  export interface Value {
    grams: string;
    other: {};
  }
  
  export interface Body {
    is_right: boolean;
    value: {};
  }
  
  export interface ComputePhase {
    skipped: boolean;
    success: boolean;
    gas_fees: number;
    gas_used: number;
    vm_steps: number;
    exit_code: number;
    exit_code_description: string;
  }
  
  export interface StoragePhase {
    fees_collected: number;
    status_change: string;
  }
  
  export interface ActionPhase {
    success: boolean;
    result_code: number;
    total_actions: number;
    skipped_actions: number;
    fwd_fees: number;
    total_fees: number;
  }
  
  export interface TransactionData {
    transaction: Transaction;
     interfaces: string[];
    children: ChildTransaction[];
  }
  
  export interface ChildTransaction {
    transaction: Transaction;
    interfaces: string[];
  }