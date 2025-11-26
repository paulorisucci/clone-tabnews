import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";
import { ServiceError } from "infra/errors";

const defaultMigrationOptions = {
  dryRun: true,
  dir: resolve("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationOptions = { ...defaultMigrationOptions, dbClient };
    return await migrationRunner(migrationOptions);
  } catch (error) {
    throw new ServiceError({
      message: "Erro na conexão com o Banco durante a execução das migrations.",
      cause: error,
    });
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationOptions = { ...defaultMigrationOptions, dbClient };
    return await migrationRunner({
      ...migrationOptions,
      dryRun: false,
    });
  } catch (error) {
    throw new ServiceError({
      message: "Erro na conexão com o Banco durante a execução das migrations.",
      cause: error,
    });
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
