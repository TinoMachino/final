import { getDb } from './src/account-manager/db';
import { AccountManager } from './src/account-manager/account-manager';
import { IdResolver } from '@atproto/identity';
import crypto from 'node:crypto';

async function main() {
  const dbConfig = { accountDbLoc: process.env.DB_POSTGRES_URL, disableWalAutoCheckpoint: false };
  console.log(dbConfig);
  // I don't need AccountManager to just verify if throwing inside AccountManager...
}
main().catch(console.error);
