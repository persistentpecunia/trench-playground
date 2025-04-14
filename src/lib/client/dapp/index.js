import dotenv from "dotenv";
import logger from "../../logger/index.js";
import { JobContainer } from "./job.js";
import { Config } from "../config/index.js";

export class DApp {
  constructor() {
    this.initialize();
    this.jobs = new JobContainer();
    this.config = new Config();
  }

  static instance = null;

  static get_instance() {
    if (!DApp.instance) {
      DApp.instance = new DApp();
    }
    return DApp.instance;
  }

  process_events() {
    ["SIGINT", "SIGTERM"].map(async (command) => {
      process.on(command, async () => {
        logger.print("Shutting down...");
        process.exit(0);
      });
    });
  }

  initialize() {
    this.process_events();
  }
}

export default DApp.get_instance();
