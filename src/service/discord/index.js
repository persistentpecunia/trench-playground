import logger from "../../lib/logger/index.js";
import { Job } from "../../lib/client/dapp/job.js";
import chalk from "chalk";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import eventbus from "../../lib/client/eventbus.js";
import { DApp } from "../../lib/client/dapp/index.js";
import { send_frontrunner_token } from "./embeds/frontrunner.js";
import { send_pumpfun_runner_token } from "./embeds/pumpfun-runner.js";

const app = DApp.get_instance();

export class DiscordJob extends Job {
  constructor() {
    super("discord", async (job) => await this.step(job), 0, 5);

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });
  }

  async step() {
    if (!this.client.isReady()) return;
  }

  async once() {
    log_status(this.name, "initialize");

    try {
      await this.client.login(app.config.get("DISCORD_TOKEN"));
      logger.print("Bot initialized and logged in");

      eventbus.on("new_pumpfun_runner", this.new_pumpfun_runner);
      eventbus.on("new_frontrunner", this.new_frontrunner);
    } catch (error) {
      logger.error(`Bot initialization failed: ${error.message}`);
      process.exit(1);
    }
  }

  new_pumpfun_runner= async (token) => {
    if (!this.client.isReady()) {
      logger.warn("Client is not ready");
      return;
    }
    await send_pumpfun_runner_token(this.client, token);
  }

  new_frontrunner = async (transaction) => {
    if (!this.client.isReady()) {
      logger.warn("Client is not ready");
      return;
    }
    await send_frontrunner_token(this.client, transaction);
  };
}

function log_status(name, action) {
  const action_colors = {
    initialize: chalk.bgYellowBright.black(" initialize "),
    step: chalk.bgBlueBright.black(" step "),
  };

  if (action_colors[action]) {
    logger.print(
      `${chalk.black("[")}${chalk.bold.yellowBright(name)}${chalk.black("]")} ${
        action_colors[action]
      }`
    );
  }
}
