import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DbService } from 'src/shared/database/database';
import * as XLSX from 'xlsx';
import { TransactionsImportRepository } from '../repository/transactiosImports.repository';

@Injectable()
export class TransactionsImportService {
    constructor(private readonly transactionsImportRepository: TransactionsImportRepository) { }


    async execute(buffer: Buffer): Promise<void> {
        try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

            for (const row of rawData) {
                row.creation_date = this.excelDateToJSDate(row.creation_date);
                row.due_date = this.excelDateToJSDate(row.due_date);
                row.actual_due_date = this.excelDateToJSDate(row.actual_due_date);
                row.reference_date = this.excelDateToJSDate(row.reference_date);
                row.start_date = this.excelDateToJSDate(row.start_date);
                row.end_date = this.excelDateToJSDate(row.enddate);

                await this.transactionsImportRepository.insertTransaction(row);
            }
        } catch (error) {
            throw new InternalServerErrorException('Error processing the Excel file', error);
        }

    }

    excelDateToJSDate(excelDate: number): Date {
        return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    }
}
