const { spawn } = require("node:child_process");

const needShellScript = process.platform === "win32";

async function main() {
  try {
    let asyncFunction;

    console.log("🚀 Starting services...");
    asyncFunction = await runAsync("npm", ["run", "services:up"]);

    console.log("⏳ Waiting for database...");
    asyncFunction = await runAsync("npm", ["run", "services:wait:database"]);

    console.log("📦 Running migrations...");
    asyncFunction = await runAsync("npm", ["run", "migrations:up"]);

    console.log("💻 Starting Next.js dev server...");
    asyncFunction = spawn("next", ["dev"], {
      stdio: "inherit",
      shell: needShellScript,
    });

    process.on("SIGINT", async () => {
      console.log("\n Caught CTRL+C. Stopping services...");
      asyncFunction.kill("SIGINT");
    });

    asyncFunction.on("exit", async (code, signal) => {
      console.log(`\nnext dev exited (code=${code}, signal=${signal})`);
      console.log("🧹 Cleaning up...");

      try {
        await runAsync("npm", ["run", "services:stop"]);
      } catch (e) {
        console.error("⚠️ Error stopping services:", e.message);
      }

      console.log("✅ Cleanup finished.");

      process.exit(code ?? 0);
    });
  } catch (error) {
    console.error("❌ Error in setup:", error.message);
    await runAsync("npm", ["run", "services:stop"]);
    process.exit(1);
  }
}

function runAsync(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: "inherit",
      shell: needShellScript,
    });
    proc.on("exit", (code, signal) => {
      if (code === 0 || signal === "SIGINT") {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

main();
