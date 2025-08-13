export class TransactionEntity {
    id: number;
    due_date: Date;
    actual_due_date: Date;
    creation_date: Date;
    reference_date: Date;
    amount: number;
    transaction_type_id: number;
    abbreviated_description: string;
    is_credit: boolean;
    start_date: Date;
    end_date: Date;
}
