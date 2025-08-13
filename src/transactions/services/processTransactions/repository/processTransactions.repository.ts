import { Injectable } from "@nestjs/common";
import { DbService } from "src/shared/database/database";
import { TransactionEntity } from "src/shared/entity/transactions.entity";

@Injectable()
export class ProcessTransactionsRepository {
    constructor(
        private readonly dbService: DbService
    ) { }

    async getAllTransactions(): Promise<TransactionEntity[]> {
        const sql = `SELECT * FROM transactions_raw`;
        return await this.dbService.query(sql);
    }
}