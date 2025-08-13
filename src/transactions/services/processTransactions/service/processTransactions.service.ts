import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ProcessTransactionsRepository } from "../repository/processTransactions.repository";

@Injectable()
export class ProcessTransactionsService {
    constructor(private readonly processTransactionsRepository: ProcessTransactionsRepository) { }

    async execute() {
        try {
            return await this.processTransactionsRepository.getAllTransactions();
        } catch (error) {
            throw new InternalServerErrorException('Error fetching transactions', error);
        }
    }
}