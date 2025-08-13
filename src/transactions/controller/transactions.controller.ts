import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsImportService } from '../services/transactionsImports/service/transactionImports.service';
import { ProcessTransactionsService } from '../services/processTransactions/service/processTransactions.service';

@Controller('transactions')
export class TransactionsController {
    constructor(
        private readonly transactionsImportService: TransactionsImportService,
        private readonly processTransactionsService: ProcessTransactionsService
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file')) 
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            return { success: false, message: 'Nenhum arquivo enviado' };
        }

        const buffer = file.buffer;
        await this.transactionsImportService.execute(buffer);

        return { success: true, message: 'Arquivo importado com sucesso' };
    }


    @Get('process')
    async processTransactions() {
        return await this.processTransactionsService.execute();
    }
}
