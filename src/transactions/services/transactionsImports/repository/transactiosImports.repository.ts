import { Injectable } from "@nestjs/common";
import { DbService } from "../../../../shared/database/database.service";
import { TransactionEntity } from "src/shared/entity/transactions.entity";
import { TransactionFidcEntity } from "src/shared/entity/transactionsFidc.entity";

@Injectable()
export class TransactionsProcessRepository {
    constructor(private dbService: DbService) { }

    async insertTransaction(data: TransactionEntity): Promise<void> {
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
            to_date($1,'YYYY-MM-DD'),
            to_date($2,'YYYY-MM-DD'),
            to_date($3,'YYYY-MM-DD'),
            to_date($4,'YYYY-MM-DD'),
            $5,
            $6,
            $7,
            $8,
            to_date($9,'YYYY-MM-DD'),
            to_date($10,'YYYY-MM-DD')
        )
        `;

        const params = [
            data.due_date,           // 'YYYY-MM-DD' ou null
            data.actual_due_date,    // idem
            data.creation_date,      // idem
            data.reference_date,     // idem
            data.amount,             // number
            data.transaction_type_id,
            data.abbreviated_description,
            data.is_credit,
            data.start_date,         // 'YYYY-MM-DD' ou null
            data.end_date            // 'YYYY-MM-DD' ou null
        ];

        await this.dbService.query(sql, params);
    }

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

    async insertTransactionFidc(transactionsFidc: TransactionFidcEntity): Promise<void> {
        const sql = `
            INSERT INTO transactions_fidc (
                due_date,
                amount,
                date,
                ccb,
                description,
                tipo
            ) VALUES (
                '${transactionsFidc.due_date}',
                ${transactionsFidc.amount},
                '${transactionsFidc.date}',
                '${transactionsFidc.ccb}',
                '${transactionsFidc.description}',
                '${transactionsFidc.tipo}'
            )`;
        await this.dbService.query(sql);
    }
}
