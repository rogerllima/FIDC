import { Controller, Post, UploadedFile, UseInterceptors, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { TransactionsProcessService } from '../services/transactionsImports/service/transactionImports.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsProcessService: TransactionsProcessService) {}

  @Post('upload-process')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndProcess(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    if (!file) {
      throw new HttpException('Nenhum arquivo enviado', HttpStatus.BAD_REQUEST);
    }

    try {
      const tempDir = path.join(os.tmpdir(), 'transactions');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `transacoes_${Date.now()}.xlsx`);

      await this.transactionsProcessService.executeFullFlow(file.buffer, tempFilePath);

      res.download(tempFilePath, 'transacoes.xlsx', (err) => {
        fs.unlink(tempFilePath, () => {});
        if (err) {
          console.error('Erro ao enviar arquivo:', err);
          throw new HttpException('Erro ao baixar o arquivo', HttpStatus.INTERNAL_SERVER_ERROR);
        }
      });
    } catch (error) {
      console.error('Erro no processamento:', error);
      throw new HttpException('Erro no processamento do arquivo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
