import migrationRunner from 'node-pg-migrate';
import { join } from "node:path";
import database from 'infra/database';

export default async function migrations(request, response) {

  if (request.method !== 'GET' && request.method !== 'POST') {
    response.status(405).json({
      error: `Method "${request.method} not allowed"`
    });
  } else if (request.method === 'GET') {
    const pendingMigrations = await findPendingMigrations();
    return response.status(200).json(pendingMigrations);
  } else {
    const migratedMigrations = await runMigrations();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }
    return response.status(200).json(migratedMigrations);
  }

}

async function findPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationOptions = getDefaultMigrationOptions(dbClient);
    return await migrationRunner(migrationOptions);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

async function runMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationOptions = getDefaultMigrationOptions(dbClient);
    return await migrationRunner({
      ...migrationOptions,
      dryRun: false
    });
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}

function getDefaultMigrationOptions(dbClient) {
  return {
    dbClient: dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations"
  }
}