import logger from "../../lib/logger/index.js";
import { Job } from "../../lib/client/dapp/job.js";
import chalk from "chalk";
import { fetch_enriched_runners } from "../../lib/backend/solana/web.js";

export class PumpFunWSSJob extends Job {
  constructor() {
    super("PumpFun Websocket", (job) => this.step(job));
  }

  async step() {    
    const tokens = await fetch_enriched_runners();
    if (!tokens.length) return logger.error("No tokens fetched.");

    log_status(this.name, "step");    
  }

  once = () => log_status(this.name, "initialize");
}

const log_status = (name, action) => {
  const colors = {
    initialize: chalk.bgYellowBright.black(" initialize "),
    step: chalk.bgBlueBright.black(" step "),
  };

  if (!colors[action]) return;

  logger.print(
    `${chalk.black("[")}${chalk.bold.greenBright(name)}${chalk.black("]")} ${
      colors[action]
    }`
  );
};
