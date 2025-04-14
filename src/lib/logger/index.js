import moment from "moment";
import chalk from "chalk";

const COLORS = {
  INFO: "#0070DD",
  WARN: "#FF7F50",
  ERROR: "#FF4500",
  DEBUG: "#9370DB",
};

const createLogMessage = (level, ...messages) => {
  const timestamp = moment().format("MMM DD YYYY HH:mm:ss");
  const color = COLORS[level] || "#FFFFFF";

  const formattedMessages = messages
    .map((msg) =>
      typeof msg === "object" ? JSON.stringify(msg, null, 2) : msg
    )
    .join("");

  return [
    chalk.gray(`[${timestamp}]`),
    chalk.hex(color)(`[${level}]`),
    chalk.white(formattedMessages),

    
  ];
};

const logger = {
  info: (...messages) => {
    console.log(...createLogMessage("INFO", ...messages));
  },

  print: (...messages) => {
    logger.info(...messages)
  },

  warn: (...messages) => {
    console.warn(...createLogMessage("WARN", ...messages));
  },

  error: (...messages) => {
    console.error(...createLogMessage("ERROR", ...messages));
  },

  debug: (...messages) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(...createLogMessage("DEBUG", ...messages));
    }
  },
};

export default logger;
