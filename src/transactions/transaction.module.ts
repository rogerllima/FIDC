import { Module } from "@nestjs/common";
import { TransactionsImportService } from "./services/transactionsImports/service/transactionImports.service";
import { TransactionsController } from "./controller/transactions.controller";
import { TransactionsImportRepository } from "./services/transactionsImports/repository/transactiosImports.repository";
import { SharedModule } from "src/shared/shared.module";

@Module(
    {
        imports: [SharedModule],
        controllers: [TransactionsController],
        providers: [TransactionsImportService, TransactionsImportRepository],
        exports: [TransactionsImportService, TransactionsImportRepository],
    }
)

export class TransactionsModule {}