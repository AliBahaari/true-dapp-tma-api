export interface TraceData {
    traces: Trace[];
    address_book: {}; // Assuming this is an empty object or can be expanded later
    metadata: {}; // Assuming this is an empty object or can be expanded later
}

export interface Trace {
    trace_id: string;
    external_hash: string;
    mc_seqno_start: string;
    mc_seqno_end: string;
    start_lt: string;
    start_utime: number;
    end_lt: string;
    end_utime: number;
    trace_info: TraceInfo;
    is_incomplete: boolean;
    trace: TraceDetails;
    transactions_order: string[];
    transactions: { [key: string]: Transaction };
}

export interface TraceInfo {
    trace_state: string;
    messages: number;
    transactions: number;
    pending_messages: number;
    classification_state: string;
}

export interface TraceDetails {
    tx_hash: string;
    in_msg_hash: string;
    children: ChildTransaction[];
}

export interface ChildTransaction {
    tx_hash: string;
    in_msg_hash: string;
    children: any[]; // Assuming no further nesting or can be expanded
}

export interface Transaction {
    account: string;
    hash: string;
    lt: string;
    now: number;
    mc_block_seqno: number;
    trace_id: string;
    prev_trans_hash: string;
    prev_trans_lt: string;
    orig_status: string;
    end_status: string;
    total_fees: string;
    total_fees_extra_currencies: {};
    description: TransactionDescription;
    block_ref: BlockRef;
    in_msg: InMsg;
    out_msgs: OutMsg[];
    account_state_before: AccountState;
    account_state_after: AccountState;
}

export interface TransactionDescription {
    type: string;
    aborted: boolean;
    destroyed: boolean;
    credit_first: boolean;
    storage_ph: StoragePhase;
    compute_ph: ComputePhase;
    action: ActionPhase;
}

export interface StoragePhase {
    storage_fees_collected: string;
    status_change: string;
}

export interface ComputePhase {
    skipped: boolean;
    success?: boolean; // Optional because it's not present in all cases
    msg_state_used?: boolean;
    account_activated?: boolean;
    gas_fees?: string;
    gas_used?: string;
    gas_limit?: string;
    gas_credit?: string;
    mode?: number;
    exit_code?: number;
    vm_steps?: number;
    vm_init_state_hash?: string;
    vm_final_state_hash?: string;
    reason?: string; // Only present when skipped is true
}

export interface ActionPhase {
    success: boolean;
    valid: boolean;
    no_funds: boolean;
    status_change: string;
    total_fwd_fees: string;
    total_action_fees: string;
    result_code: number;
    tot_actions: number;
    spec_actions: number;
    skipped_actions: number;
    msgs_created: number;
    action_list_hash: string;
    tot_msg_size: MessageSize;
}

export interface MessageSize {
    cells: string;
    bits: string;
}

export interface BlockRef {
    workchain: number;
    shard: string;
    seqno: number;
}

export interface InMsg {
    hash: string;
    source: string | null;
    destination: string;
    value: string | null;
    value_extra_currencies: {} | null;
    fwd_fee: string | null;
    ihr_fee: string | null;
    created_lt: string | null;
    created_at: string | null;
    opcode: string;
    ihr_disabled: boolean | null;
    bounce: boolean | null;
    bounced: boolean | null;
    import_fee: string;
    message_content: MessageContent;
    init_state: null;
}

export interface OutMsg {
    hash: string;
    source: string;
    destination: string;
    value: string;
    value_extra_currencies: {};
    fwd_fee: string;
    ihr_fee: string;
    created_lt: string;
    created_at: string;
    opcode: null;
    ihr_disabled: boolean;
    bounce: boolean;
    bounced: boolean;
    import_fee: null;
    message_content: MessageContent;
    init_state: null;
}

export interface MessageContent {
    hash: string;
    body: string;
    decoded: null;
}

export interface AccountState {
    hash: string;
    balance: string;
    extra_currencies: {};
    account_status: string;
    frozen_hash: null;
    data_hash: string | null;
    code_hash: string | null;
}