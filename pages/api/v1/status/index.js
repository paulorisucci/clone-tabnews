import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const version = parseInt(
    (await database.query("SHOW server_version;")).rows[0].server_version,
  );

  const maxConnections = parseInt(
    (await database.query("SHOW max_connections;")).rows[0].max_connections,
  );

  const databaseName = process.env.POSTGRES_DB;
  const openedConnections = parseInt(
    (
      await database.query({
        text: "SELECT COUNT(*) FROM pg_stat_activity WHERE datName = $1;",
        values: [databaseName],
      })
    ).rows[0].count,
  );

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: version,
        max_connections: maxConnections,
        opened_connections: openedConnections,
      },
    },
  });
}

export default status;
