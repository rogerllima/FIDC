import { Controller, Post, UploadedFile, UseInterceptors, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TransactionsProcessService } from '../services/transactionsImports/service/transactionImports.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsProcessService: TransactionsProcessService) { }

  @Post('upload-process')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndProcess(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    if (!file) {
      throw new HttpException('Nenhum arquivo enviado', HttpStatus.BAD_REQUEST);
    }

    try {
      const buffer = await this.transactionsProcessService.executeFullFlow(file.buffer);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="transacoes.xlsx"');
      res.send(buffer);

    } catch (error) {
      console.error('Erro no processamento:', error);
      throw new HttpException('Erro no processamento do arquivo', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
