import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsImportService } from '../services/transactionsImports/service/transactionImports.service';

@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsImportService: TransactionsImportService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file')) 
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            return { success: false, message: 'Nenhum arquivo enviado' };
        }

        const buffer = file.buffer;
        await this.transactionsImportService.importFromBuffer(buffer);

        return { success: true, message: 'Arquivo importado com sucesso' };
    }
}
