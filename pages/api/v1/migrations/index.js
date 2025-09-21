import migrationRunner from 'node-pg-migrate';
import { join } from "node:path";
import database from 'infra/database';

export default async function migrations(request, response) {

  if (request.method === 'GET') {
    const pendingMigrations = await findPendingMigrations();
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === 'POST') {
    const migratedMigrations = await runMigrations();

    if (migratedMigrations.length > 0) {
      return response.status(201).json(migratedMigrations);
    }
    return response.status(200).json(migratedMigrations);
  }

  response.status(405).end();

}

async function findPendingMigrations() {
  const dbClient = await database.getNewClient();
  const migrationOptions = getDefaultMigrationOptions(dbClient);

  const pendingMigrations = await migrationRunner(migrationOptions);
  await dbClient.end();
  return pendingMigrations;
}

async function runMigrations() {
  const dbClient = await database.getNewClient();
  const migrationOptions = getDefaultMigrationOptions(dbClient);
  const migratedMigrations = await migrationRunner({
    ...migrationOptions,
    dryRun: false
  });

  await dbClient.end();

  return migratedMigrations;
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