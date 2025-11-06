import retry from "async-retry";
import database from "infra/database";

async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
      onRetry: (error, attempt) => {
        console.log(
          `${attempt} - Failed to fetch status page: ${error.message}`,
        );
      },
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");

      if (!response.ok) {
        throw new Error(`Http error ${response.status}`);
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

export default {
  waitForAllServices,
  clearDatabase,
};
