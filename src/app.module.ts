import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { TransactionsModule } from './transactions/transaction.module';

@Module({
  imports: [SharedModule, TransactionsModule],
  controllers: [AppController],
  providers: [
    AppService
  ],
})
export class AppModule { }
