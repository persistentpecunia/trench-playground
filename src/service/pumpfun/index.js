import { fetch_enriched_runners } from "../../lib/backend/solana/web.js";
import logger from "../../lib/logger/index.js";
import chalk from "chalk";
import { Job } from "../../lib/client/dapp/job.js";
import eventbus from "../../lib/client/eventbus.js";
import Token from "../../lib/backend/database/models/pumpfun-token.js";

export class PumpFunJob extends Job {
  constructor() {
    super("PumpFun", (job) => this.step(job));
  }

  async step() {
    const tokens = await fetch_enriched_runners();        
    if (!tokens.length) return logger.error("No tokens fetched");    

    for (const token of tokens) {            
      const existing_token = await Token.findOne({ mint: token.mint });

      if (!existing_token) {      
        try {
          const new_token = new Token({ mint: token.mint });
          await new_token.save();          

          eventbus.emit("new_pumpfun_runner", token);
        } catch (error) {
          logger.error(`Failed to save token: ${error.message}`);
        }
      }
    }

    //log_status(this.name, "step");
  }

  async once() {
    log_status(this.name, "initialize");
  }
}

function log_status(name, action) {
  const colors = {
    initialize: chalk.bgYellowBright.black(" initialize "),
    step: chalk.bgBlueBright.black(" step "),
  };
  const color = colors[action];
  if (color) logger.print(`${chalk.black("[")}${chalk.bold.greenBright(name)}${chalk.black("]")} ${color}`);
}
