import { DApp } from "./lib/client/dapp/index.js";
import { PumpFunJob } from "./service/pumpfun/index.js";
import logger from "./lib/logger/index.js";
import { connect_database } from "./lib/backend/database/db.js";
import { DiscordJob } from "./service/discord/index.js";
import { JobContainer } from "./lib/client/dapp/job.js";
import { BlockChainJob } from "./service/blockchain/index.js";

async function main() {
  try {
    const app = DApp.get_instance();

    await connect_database({
      MONGO_URI: app.config.get("MONGO_URI"),
      MONGO_NAME: app.config.get("MONGO_NAME"),
    });
        
    app.jobs.add_job(DiscordJob);
    app.jobs.add_job(BlockChainJob);
    app.jobs.add_job(PumpFunJob);    

  } catch (error) {    
    logger.error(`Application startup failed: ${error.message}`);
    process.exit(1);
  }
}

main();
