import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv'

dotenv.config();

@Injectable()
export class DbService implements OnModuleInit {
  private pool: Pool;

  async onModuleInit() {
    await this.initPool();
  }

  private async initPool() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: String(process.env.DB_PASSWORD),
      port: Number(process.env.DB_PORT),
      ssl: {
        rejectUnauthorized: false, // necessário para Render
      },
      max: 20,
      idleTimeoutMillis: 30000,
    });

    try {
      const client = await this.pool.connect();
      console.log('✅ Conexão com o banco Postgres estabelecida com sucesso');
      client.release();
    } catch (err) {
      console.error('❌ Erro ao conectar no Postgres:', err);
      process.exit(1); // encerra o app se não conseguir conectar
    }

    // Fecha o pool quando a aplicação encerrar
    process.once('SIGTERM', () => this.closePool());
    process.once('SIGINT', () => this.closePool());
  }

  private async closePool() {
    console.log('🔻 Fechando pool de conexões...');
    await this.pool.end();
    console.log('✅ Pool fechado.');
    process.exit(0);
  }

  // Método para abrir uma conexão manual (opcional)
  async open(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // Query genérica
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows as T[];
    } catch (err) {
      console.error('Erro na query:', err);
      throw err;
    }
  }

  // Retorna apenas uma linha
  async findOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length ? rows[0] : null;
  }

}
