import app from './app';
import { config } from './config';
import { initDb } from './repositories/db';

async function startServer() {
  try {
    // 1. Initialize database schema & seed data
    await initDb();

    // 2. Start HTTP listener
    app.listen(config.port, () => {
      console.log(`======================================================`);
      console.log(`🎓 EduSathi API Server running at http://localhost:${config.port}`);
      console.log(`🚀 Client URL: ${config.clientUrl}`);
      console.log(`🔒 Mode: ${config.env}`);
      console.log(`======================================================`);
    });
  } catch (error) {
    console.error('Fatal error during server startup:', error);
    process.exit(1);
  }
}

startServer();
