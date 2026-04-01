import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const DEFAULT_DB_PORT = 5432;
function parsePort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
const dbPort = parsePort(process.env.DB_PORT, DEFAULT_DB_PORT);
const dbLogging =
  process.env.DB_LOGGING !== undefined
    ? process.env.DB_LOGGING.toLowerCase() === 'true'
    : false;
const dbSslRejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED;
const dbSslRejectUnauthorized =
  dbSslRejectUnauthorizedEnv !== undefined
    ? dbSslRejectUnauthorizedEnv.toLowerCase() === 'true'
    : true;
const dbSsl =
  process.env.DB_SSL && process.env.DB_SSL.toLowerCase() === 'false'
    ? false
    : { rejectUnauthorized: dbSslRejectUnauthorized };

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: dbPort,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: dbSsl,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: dbLogging,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
