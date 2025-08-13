import { Controller, Get, Post, UploadedFile, UseInterceptors, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsImportService } from '../services/transactionsImports/service/transactionImports.service';
import { ProcessTransactionsService } from '../services/processTransactions/service/processTransactions.service';
import type { Response } from 'express';
import * as path from 'path';

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
    async processTransactions(@Res() res: Response) {
        await this.processTransactionsService.execute(); // gera o XLS

        const filePath = path.join(process.cwd(), 'transacoes.xlsx'); // caminho do arquivo
        res.download(filePath, 'transacoes.xlsx', (err) => {
            if (err) {
                res.status(500).send('Erro ao baixar o arquivo');
            }
        });
    }
}
