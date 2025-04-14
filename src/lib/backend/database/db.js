import logger from "../../logger/index.js";
import mongoose from "mongoose";

export async function connect_database({ MONGO_URI, MONGO_NAME }) {
  try {
    await mongoose.connect(MONGO_URI);

    logger.info(`Successfully connected to ${MONGO_NAME} database`);

    mongoose.connection.on("disconnected", () => {
      logger.warn(`Disconnected from ${MONGO_NAME} database`);
    });

    mongoose.connection.on("error", (err) => {
      logger.error(
        `Database connection error for ${MONGO_NAME}: ${err.message}`
      );
    });
  } catch (error) {
    logger.error(
      `Failed to connect to ${MONGO_NAME} database: ${error.message}`
    );

    throw error;
  }
}
