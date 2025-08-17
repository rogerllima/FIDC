import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

types.setTypeParser(1082, (val: string) => val);

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
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
    });

    try {
      const client = await this.pool.connect();
      console.log('✅ Conexão com o banco Postgres estabelecida com sucesso');
      client.release();
    } catch (err) {
      console.error('❌ Erro ao conectar no Postgres:', err);
      process.exit(1);
    }

    process.once('SIGTERM', () => this.closePool());
    process.once('SIGINT', () => this.closePool());
  }

  private async closePool() {
    console.log('🔻 Fechando pool de conexões...');
    await this.pool.end();
    console.log('✅ Pool fechado.');
    process.exit(0);
  }

  async open(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows as T[];
    } catch (err) {
      console.error('Erro na query:', err);
      throw err;
    }
  }

  async findOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length ? rows[0] : null;
  }
}
