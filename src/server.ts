import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.info(`WashMate API listening on port ${env.PORT}`);
  });
};

void startServer().catch(() => {
  process.exit(1);
});
