import { fetch_enriched_runners } from "../../lib/backend/solana/web.js";
import logger from "../../lib/logger/index.js";
import chalk from "chalk";
import { Job } from "../../lib/client/dapp/job.js";
import eventbus from "../../lib/client/eventbus.js";
import { Connection } from "@solana/web3.js";
import { handle_transaction } from "./handlers/frontrunner.js";

export class BlockChainJob extends Job {
  constructor() {
    super("BlockChain", (job) => this.step(job));

    this.connection = null;
    this.program_callbacks = new Map();
    this.subscription_id = null;
  }

  async step() {}

  async verify_connection() {
    try {
      const version = await Promise.race([
        this.connection.getVersion(),
        new Promise((_, reject) => setTimeout(() => reject(), 5000)),
      ]);
      logger.print(
        `Connected to Solana node: ${version?.["solana-core"] || "unknown"}`
      );
    } catch {
      logger.error("Could not fetch Solana node version");
    }
  }

  register_program_callback(program_id, callback) {
    this.program_callbacks.set(program_id, callback);
    logger.debug(`Registered callback for program: ${program_id}`);
  }

  async start_transaction_watcher() {
    this.subscription_id = this.connection.onLogs(
      "all",
      this.handle_log.bind(this),
      "confirmed"
    );
    logger.debug("Log subscription started");
  }

  async handle_log(logs) {
    if (logs.err || !logs.logs.length) return;

    try {
      const matched_program_id = this.find_matching_program_id(logs.logs);
      if (!matched_program_id) return;

      const tx = await this.fetch_transaction(logs.signature);
      if (!tx) return;

      // Handle program callbacks
      const callback = this.program_callbacks.get(matched_program_id);
      if (callback) {
        await callback(tx);
      }
    } catch (error) {
      logger.error(
        `Error processing log for ${logs.signature}: ${error.message}`
      );
    }
  }

  async fetch_transaction(signature) {
    try {
      const tx = await Promise.race([
        this.connection.getParsedTransaction(signature, {
          maxSupportedTransactionVersion: 0,
          commitment: "confirmed",
        }),
        new Promise((_, reject) => setTimeout(() => reject(), 8000)),
      ]);

      return tx?.meta?.err ? null : tx;
    } catch {
      return null;
    }
  }

  async cleanup_subscription() {
    try {
      this.connection.removeOnLogsListener(this.subscription_id);
      logger.print("Log subscription removed");
    } catch (error) {
      logger.error(`Error removing log subscription: ${error.message}`);
    }
  }

  find_matching_program_id(logs) {
    const program_ids = [...this.program_callbacks.keys()];
    return (
      program_ids.find((id) => logs.some((log) => log.includes(id))) || null
    );
  }

  async once() {
    log_status(this.name, "initialize");

    this.connection = new Connection(
      "https://rpc.ironforge.network/mainnet?apiKey=01J4RYMAWZC65B6CND9DTZZ5BK",
      {
        commitment: "confirmed",
      }
    );
    await this.verify_connection();

    // Register MEV bot handler
    this.register_program_callback(
      "E6YoRP3adE5XYneSseLee15wJshDxCsmyD2WtLvAmfLi",
      handle_transaction
    );

    // this.register_program_callback(
    //   "B91piBSfCBRs5rUxCMRdJEGv7tNEnFxweWcdQJHJoFpi",
    //   handle_transaction
    // );

    this.start_transaction_watcher();
  }
}

function log_status(name, action) {
  const colors = {
    initialize: chalk.bgYellowBright.black(" initialize "),
    step: chalk.bgBlueBright.black(" step "),
  };
  const color = colors[action];
  if (color)
    logger.print(
      `${chalk.black("[")}${chalk.bold.redBright(name)}${chalk.black(
        "]"
      )} ${color}`
    );
}
