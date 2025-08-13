import { Module } from "@nestjs/common";
import { TransactionsImportService } from "./services/transactionsImports/service/transactionImports.service";
import { TransactionsController } from "./controller/transactions.controller";
import { TransactionsImportRepository } from "./services/transactionsImports/repository/transactiosImports.repository";
import { SharedModule } from "src/shared/shared.module";
import { ProcessTransactionsService } from "./services/processTransactions/service/processTransactions.service";
import { ProcessTransactionsRepository } from "./services/processTransactions/repository/processTransactions.repository";

@Module(
    {
        imports: [SharedModule],
        controllers: [TransactionsController],
        providers: [
            TransactionsImportService,
            TransactionsImportRepository,
            ProcessTransactionsService,
            ProcessTransactionsRepository],
        exports: [
            TransactionsImportService,
            TransactionsImportRepository,
            ProcessTransactionsService,
            ProcessTransactionsRepository
        ],
    }
)

export class TransactionsModule { }