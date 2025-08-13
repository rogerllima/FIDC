import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ProcessTransactionsRepository } from "../repository/processTransactions.repository";
import * as XLSX from "xlsx";
import * as fs from "fs";

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
export class ProcessTransactionsService {
    constructor(
        private readonly processTransactionsRepository: ProcessTransactionsRepository
    ) { }

    async execute(): Promise<MovimentoFIDC[]> {
        try {
            const transactions = await this.processTransactionsRepository.getAllTransactions();
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
                        // Brasil Card atrasado → vira fundo
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
                            description: transaction.abbreviated_description,
                            ccb: `${ccb.id}`,
                            tipo: "Fundo"
                        };
                        ccb.movimentos.push(movimento);
                        result.push(movimento);
                    } else {
                        result.push({
                            id: transaction.id,
                            due_date: transaction.due_date,
                            amount,
                            date: transaction.reference_date,
                            description: transaction.abbreviated_description,
                            ccb: "",
                            tipo: "Brasil Card"
                        });
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
                        description: transaction.abbreviated_description,
                        ccb: `${ccb.id}`,
                        tipo: "Fundo"
                    };
                    ccb.movimentos.push(movimento);
                    result.push(movimento);
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

                        result.push({
                            id: transaction.id,
                            due_date: mov.due_date,
                            amount: -abatimento,
                            date: transaction.reference_date,
                            description: `Abate de crédito em CCB ${ccb.id}`,
                            ccb: `${ccb.id}`,
                            tipo: "Fundo"
                        });
                    }
                }

                if (creditoRestante > 0) {
                    result.push({
                        id: transaction.id,
                        due_date: transaction.due_date,
                        amount: -creditoRestante,
                        date: transaction.reference_date,
                        description: "Abate de crédito em Brasil Card",
                        ccb: "",
                        tipo: "Brasil Card"
                    });
                    creditoRestante = 0;
                }

                if (creditoRestante > 0) {
                    saldoMaior += creditoRestante;
                }
            }

            // 🔹 Gerar XLSX
            const worksheet = XLSX.utils.json_to_sheet(result);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transacoes");
            XLSX.writeFile(workbook, "transacoes.xlsx");

            console.log("Arquivo transacoes.xlsx gerado com sucesso!");

            return result;

        } catch (error) {
            console.error(error);
            throw new InternalServerErrorException("Erro ao processar transações");
        }
    }
}
