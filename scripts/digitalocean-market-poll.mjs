const appUrl = process.env.DIGITALOCEAN_APP_URL;
const cronSecret = process.env.CRON_SECRET;

if (!appUrl) {
  throw new Error("DIGITALOCEAN_APP_URL is required for scheduled market polling.");
}

if (!cronSecret) {
  throw new Error("CRON_SECRET is required for scheduled market polling.");
}

const endpoint = new URL("/api/market/poll", appUrl);
const response = await fetch(endpoint, {
  headers: {
    "X-FutureFund-Cron": cronSecret,
  },
  method: "POST",
});
const body = await response.text();

if (!response.ok) {
  console.error(body);
  throw new Error(`Market poll failed with HTTP ${response.status}.`);
}

console.log(body);

