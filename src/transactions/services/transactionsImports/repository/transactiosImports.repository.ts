import { Injectable } from "@nestjs/common";
import { DbService } from "src/shared/database/database";

@Injectable()
export class TransactionsImportRepository {
    constructor(private dbService: DbService) {}

    async insertTransaction(data: any): Promise<void> {
        const sql = `
            INSERT INTO transactions_raw (
            due_date,
            actual_due_date, 
            creation_date, 
            reference_date, 
            amount, 
            transaction_type_id, 
            abbreviated_description,
            is_credit, 
            start_date,
            end_date
            ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )`

        const params = [
            data.due_date,
            data.actual_due_date,
            data.creation_date,
            data.reference_date,
            data.amount,
            data.transaction_type_id,
            data.abbreviated_description,
            data.is_credit,
            data.start_date,
            data.enddate
        ];

        await this.dbService.query(sql, params);
    }
}
