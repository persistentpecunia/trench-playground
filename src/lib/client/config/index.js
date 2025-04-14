import { config } from "dotenv";
import logger from "../../logger/index.js";

export class Config {
  constructor() {
    this.load_environments("dev");
  }

  load_environments(env) {
    const result = config({ path: `.env.${env}` });

    if (result.error) {
      logger.error(`Environment file .env.${env} not found or unable to load.`);
      throw new Error(`Unable to load environment file: .env.${env}`);
    }

    logger.info(`Environment file .env.${env} successfully loaded.`);
  }

  log_missing_key(key) {
    logger.warn(`Config key "${key}" is missing!`);
  }

  get(key) {
    let value = process.env[key];

    if (!value) {
      this.log_missing_key(key);
      value = null;
    }

    return value;
  }

  get_all() {
    return Object.keys(process.env).reduce((acc, key) => {
      acc[key] = this.get_value(key);
      return acc;
    }, {});
  }

  require(key) {
    const value = this.get_value(key);
    if (!value) {
      logger.error(`Config key "${key}" is required but not found!`);
      process.exit(1);
    }
    return value;
  }
}
