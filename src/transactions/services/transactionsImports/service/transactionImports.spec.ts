import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsProcessRepository } from '../repository/transactiosImports.repository';
import * as XLSX from 'xlsx';
import { TransactionsProcessService } from './transactionImports.service';

jest.mock('xlsx', () => ({
    read: jest.fn(),
    utils: {
        sheet_to_json: jest.fn(),
        json_to_sheet: jest.fn(),
        book_new: jest.fn(),
        book_append_sheet: jest.fn(),
    },
    write: jest.fn(),
}));

describe('TransactionsProcessService', () => {
    let service: TransactionsProcessService;
    let repository: jest.Mocked<TransactionsProcessRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsProcessService,
                {
                    provide: TransactionsProcessRepository,
                    useValue: {
                        insertTransaction: jest.fn(),
                        getAllTransactions: jest.fn(),
                        insertTransactionFidc: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<TransactionsProcessService>(TransactionsProcessService);
        repository = module.get(TransactionsProcessRepository);
    });

    describe('excelDateToISO', () => {
        it('may convert excel date to ISO format', () => {
            const excelDate = 44927;
            const result = service.excelDateToISO(excelDate);
            expect(result).toBe('2023-01-01');
        });

        it('may return null if value is null', () => {
            expect(service.excelDateToISO(null)).toBeNull();
        });
    });

    describe('executeFullFlow', () => {
        const mockBuffer = Buffer.from('fake buffer');

        beforeEach(() => {
            (XLSX.read as jest.Mock).mockReturnValue({
                SheetNames: ['Planilha1'],
                Sheets: { Planilha1: {} },
            });

            (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
                {
                    id: 1,
                    reference_date: 44927,
                    creation_date: 44927,
                    due_date: 44928,
                    actual_due_date: 44929,
                    start_date: 44927,
                    end_date: 44928,
                    transaction_type_id: 4,
                    amount: 100,
                    abbreviated_description: 'Teste',
                    is_credit: false,
                },
            ]);

            (XLSX.utils.json_to_sheet as jest.Mock).mockReturnValue({ A1: { v: 'mock' } });
            (XLSX.utils.book_new as jest.Mock).mockReturnValue({});
            (XLSX.utils.book_append_sheet as jest.Mock).mockImplementation(() => { });
            (XLSX.write as jest.Mock).mockReturnValue(Buffer.from('xlsx-buffer'));

            repository.getAllTransactions.mockResolvedValue([
                {
                    id: 1,
                    reference_date: new Date('2023-01-01'),
                    actual_due_date: new Date('2023-01-01'),
                    due_date: new Date('2023-01-02'),
                    amount: 100,
                    transaction_type_id: 4,
                    abbreviated_description: 'Teste',
                    is_credit: false,
                    creation_date: new Date('2023-01-01'),
                    start_date: new Date('2023-01-01'),
                    end_date: new Date('2023-01-01')
                },
            ]);
        });

        it('should return a buffer and call repository methods', async () => {
            const result = await service.executeFullFlow(mockBuffer);

            expect(result).toBeInstanceOf(Buffer);
            expect(repository.insertTransaction).toHaveBeenCalledTimes(1);
            expect(repository.getAllTransactions).toHaveBeenCalledTimes(1);
            expect(repository.insertTransactionFidc).toHaveBeenCalledTimes(1);
            expect(XLSX.write).toHaveBeenCalledWith(expect.any(Object), { type: 'buffer', bookType: 'xlsx' });
        });

        it('should throw an error if repository.getAllTransactions fails', async () => {
            repository.getAllTransactions.mockRejectedValueOnce(new Error('DB error'));

            await expect(service.executeFullFlow(mockBuffer))
                .rejects
                .toThrow('Erro ao processar arquivo e gerar XLS');
        });
    });
});
