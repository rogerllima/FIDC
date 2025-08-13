import { Injectable } from "@nestjs/common";
import { DbService } from "src/shared/database/database";
import { TransactionEntity } from "src/shared/entity/transactions.entity";

@Injectable()
export class ProcessTransactionsRepository {
    constructor(
        private readonly dbService: DbService
    ) { }

    async getAllTransactions(): Promise<TransactionEntity[]> {
        const sql = `
        SELECT 
        t.id,
        TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
        TO_CHAR(t.actual_due_date, 'YYYY-MM-DD') AS actual_due_date,
        TO_CHAR(t.creation_date, 'YYYY-MM-DD') AS creation_date,
        TO_CHAR(t.reference_date, 'YYYY-MM-DD') AS reference_date,
        t.amount,
        t.transaction_type_id,
        t.abbreviated_description,
        t.is_credit,
        TO_CHAR(t.start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(t.end_date, 'YYYY-MM-DD') AS end_date
        FROM transactions_raw t`;
        return await this.dbService.query(sql);
    }
}