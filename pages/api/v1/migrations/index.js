import { createRouter } from "next-connect";
import migrationRunner from "node-pg-migrate";
import { resolve } from "node:path";
import database from "infra/database";
import controller from "infra/controller.js";

const router = createRouter();

router.get(getHandler);
router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const pendingMigrations = await findPendingMigrations();
  return response.status(200).json(pendingMigrations);
}

async function postHandler(request, response) {
  const migratedMigrations = await runMigrations();

  if (migratedMigrations.length > 0) {
    return response.status(201).json(migratedMigrations);
  }
  return response.status(200).json(migratedMigrations);
}

async function findPendingMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationOptions = getDefaultMigrationOptions(dbClient);
    return await migrationRunner(migrationOptions);
  } finally {
    await dbClient?.end();
  }
}

async function runMigrations() {
  let dbClient;
  try {
    dbClient = await database.getNewClient();
    const migrationOptions = getDefaultMigrationOptions(dbClient);
    return await migrationRunner({
      ...migrationOptions,
      dryRun: false,
    });
  } finally {
    await dbClient?.end();
  }
}

function getDefaultMigrationOptions(dbClient) {
  return {
    dbClient: dbClient,
    dryRun: true,
    dir: resolve("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };
}
