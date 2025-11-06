import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
});

describe("DELETE to /api/v1/migrations", () => {
  describe("Anonymous user", () => {
    test("Should return an error", async () => {
      const responseMigrations = await fetch(
        "http://localhost:3000/api/v1/migrations",
        {
          method: "DELETE",
        },
      );

      const responseStatus = await fetch("http://localhost:3000/api/v1/status");
      const responseStatusBody = await responseStatus.json();
      const responseMigrationsBody = await responseMigrations.json();

      expect(responseMigrations.status).toBe(405);
      expect(
        responseStatusBody.dependencies.database.opened_connections,
      ).toEqual(1);
      expect(typeof responseMigrationsBody.error).toEqual("string");
    });
  });
});
