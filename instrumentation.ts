export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAgeScheduler } = await import("./lib/age-updater");
    startAgeScheduler();
  }
}
