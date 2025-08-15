import { Injectable, InternalServerErrorException } from "@nestjs/common";
import * as XLSX from "xlsx";
import { TransactionsProcessRepository } from "../repository/transactiosImports.repository";

export interface CCB {
    id: number;
    saldo: number;
    movimentos: any[];
}

export interface MovimentoFIDC {
    id: number;
    due_date: Date;
    amount: number;
    date: Date;
    description: string;
    ccb: string;
    tipo: string;
}

@Injectable()
export class TransactionsProcessService {
    constructor(
        private readonly transactionsProcessRepository: TransactionsProcessRepository,
    ) { }

    async executeFullFlow(buffer: Buffer, outputPath: string) {
        try {
            const workbookInput = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbookInput.SheetNames[0];
            const sheet = workbookInput.Sheets[sheetName];
            const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

            for (const row of rawData) {
                row.reference_date = this.excelDateToISO(row.reference_date);
                row.creation_date = this.excelDateToISO(row.creation_date);
                row.due_date = this.excelDateToISO(row.due_date);
                row.actual_due_date = this.excelDateToISO(row.actual_due_date);
                row.start_date = this.excelDateToISO(row.start_date);
                row.end_date = this.excelDateToISO(row.end_date);

                await this.transactionsProcessRepository.insertTransaction(row);
            }

            const transactions = await this.transactionsProcessRepository.getAllTransactions();
            const result: MovimentoFIDC[] = [];
            const ccbList: CCB[] = [];
            let ccbCounter = 1;

            const brasilcardNatures = [
                "4", "5", "1613", "142", "790", "98", "9923", "9931", "22138",
                "24437", "24444", "24479", "441", "461", "9926", "30110",
                "30118", "22198", "2102", "2110", "22150", "24317", "104",
                "431", "731", "1629", "84", "22140"
            ];

            let saldoMaior = 0;

            for (const transaction of transactions) {
                const isBrasilcard = brasilcardNatures.includes(String(transaction.transaction_type_id));
                const amount = Number(transaction.amount);

                if (isBrasilcard) {
                    const atrasada = transaction.reference_date >= transaction.actual_due_date;

                    if (atrasada) {
                        let ccb = ccbList[ccbList.length - 1];
                        if (!ccb) {
                            ccb = { id: ccbCounter++, saldo: 0, movimentos: [] };
                            ccbList.push(ccb);
                        }
                        ccb.saldo += amount;

                        const movimento: MovimentoFIDC = {
                            id: transaction.id,
                            due_date: transaction.due_date,
                            amount,
                            date: transaction.reference_date,
                            description: `A${transaction.transaction_type_id} - ${transaction.abbreviated_description}`,
                            ccb: `${ccb.id}`,
                            tipo: "Fundo"
                        };
                        ccb.movimentos.push(movimento);
                        result.push(movimento);
                        await this.transactionsProcessRepository.insertTransactionFidc(movimento);
                    } else {
                        const movimento = {
                            id: transaction.id,
                            due_date: transaction.due_date,
                            amount,
                            date: transaction.reference_date,
                            description: `A${transaction.transaction_type_id} - ${transaction.abbreviated_description}`,
                            ccb: "",
                            tipo: "Brasil Card"
                        };
                        result.push(movimento);
                        await this.transactionsProcessRepository.insertTransactionFidc(movimento);
                    }
                    continue;
                }

                if (!transaction.is_credit) {
                    let ccb = ccbList[ccbList.length - 1];
                    if (!ccb) {
                        ccb = { id: ccbCounter++, saldo: 0, movimentos: [] };
                        ccbList.push(ccb);
                    }
                    ccb.saldo += amount;

                    const movimento: MovimentoFIDC = {
                        id: transaction.id,
                        due_date: transaction.due_date,
                        amount,
                        date: transaction.reference_date,
                        description: `A${transaction.transaction_type_id} - ${transaction.abbreviated_description}`,
                        ccb: `${ccb.id}`,
                        tipo: "Fundo"
                    };
                    ccb.movimentos.push(movimento);
                    result.push(movimento);
                    await this.transactionsProcessRepository.insertTransactionFidc(movimento);
                    continue;
                }

                let creditoRestante = amount;

                for (const ccb of ccbList) {
                    if (creditoRestante <= 0) break;

                    const movimentosPendentes = ccb.movimentos.filter(m => m.date <= transaction.reference_date && m.amount > 0);
                    for (const mov of movimentosPendentes) {
                        if (creditoRestante <= 0) break;
                        const abatimento = Math.min(mov.amount, creditoRestante);
                        mov.amount -= abatimento;
                        ccb.saldo -= abatimento;
                        creditoRestante -= abatimento;

                        const movimento = {
                            id: transaction.id,
                            due_date: mov.due_date,
                            amount: -abatimento,
                            date: transaction.reference_date,
                            description: `CCB`,
                            ccb: `${ccb.id}`,
                            tipo: "Fundo"
                        };
                        result.push(movimento);
                        await this.transactionsProcessRepository.insertTransactionFidc(movimento);
                    }
                }

                if (creditoRestante > 0) {
                    const movimento = {
                        id: transaction.id,
                        due_date: transaction.due_date,
                        amount: -creditoRestante,
                        date: transaction.reference_date,
                        description: `A${transaction.transaction_type_id} - ${transaction.abbreviated_description}`,
                        ccb: "",
                        tipo: "Brasil Card"
                    };
                    result.push(movimento);
                    await this.transactionsProcessRepository.insertTransactionFidc(movimento);
                    creditoRestante = 0;
                }

                if (creditoRestante > 0) {
                    saldoMaior += creditoRestante;
                }
            }

            const worksheet = XLSX.utils.json_to_sheet(result);
            const workbookOut = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbookOut, worksheet, "Transacoes");
            XLSX.writeFile(workbookOut, outputPath);

        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Erro ao processar arquivo e gerar XLS");
        }
    }


    excelDateToISO(excelSerial: number | null): string | null {
        if (excelSerial == null) return null;
        const ms = Math.round((excelSerial - 25569) * 86400 * 1000);
        const d = new Date(ms);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
}
