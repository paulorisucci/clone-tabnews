import database from "infra/database";

beforeAll(cleanDatabase);

async function cleanDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

test("DELETE to /api/v1/migrations should return 405", async () => {

  const responseMigrations = await fetch("http://localhost:3000/api/v1/migrations", {
    method: 'DELETE'
  });

  const responseStatus = await fetch("http://localhost:3000/api/v1/status");
  const responseStatusBody = await responseStatus.json();
  const responseMigrationsBody = await responseMigrations.json();

  expect(responseMigrations.status).toBe(405);
  expect(responseStatusBody.dependencies.database.opened_connections).toEqual(1);
  expect(typeof responseMigrationsBody.error).toEqual("string");
});
