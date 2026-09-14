import { spawn } from "node:child_process";

/**
 * FutureFund Classroom - DigitalOcean process entrypoint
 *
 * App Platform run commands are kept intentionally simple. This wrapper owns
 * the startup sequence so we do not depend on shell chaining behavior in the
 * platform's run_command field.
 *
 * 1. Run the production PostgreSQL + DigitalOcean credential migrations.
 * 2. Start the long-running Vinext production server.
 * 3. Forward termination signals and exit status so App Platform can manage
 *    the service normally.
 */

await import("./digitalocean-migrate.mjs");

console.log("Starting FutureFund Vinext production server...");

const vinext = spawn(
  "./node_modules/.bin/vinext",
  ["start", "--hostname", "0.0.0.0"],
  {
    stdio: "inherit",
    env: process.env,
  },
);

const forwardSignal = (signal) => {
  if (!vinext.killed) {
    vinext.kill(signal);
  }
};

process.on("SIGTERM", () => forwardSignal("SIGTERM"));
process.on("SIGINT", () => forwardSignal("SIGINT"));

const exitCode = await new Promise((resolve, reject) => {
  vinext.once("error", reject);
  vinext.once("exit", (code, signal) => {
    if (signal) {
      console.error(`Vinext exited because of signal ${signal}.`);
      resolve(1);
      return;
    }

    resolve(code ?? 1);
  });
});

process.exitCode = exitCode;
