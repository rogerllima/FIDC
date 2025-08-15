import { Module } from "@nestjs/common";
import { TransactionsController } from "./controller/transactions.controller";
import { SharedModule } from "src/shared/shared.module";
import { TransactionsProcessService } from "./services/transactionsImports/service/transactionImports.service";
import { TransactionsProcessRepository } from "./services/transactionsImports/repository/transactiosImports.repository";

@Module(
    {
        imports: [SharedModule],
        controllers: [TransactionsController],
        providers: [
            TransactionsProcessService,
            TransactionsProcessRepository
        ],
        exports: [
            TransactionsProcessService,
            TransactionsProcessRepository
        ],
    }
)

export class TransactionsModule { }