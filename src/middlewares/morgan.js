import morgan from "morgan";
import chalk from "chalk";
import logger from "./logger.js";

const customFormat = (tokens, req, res) => {
  const status = tokens.status(req, res);
  const statusColor =
    status >= 500
      ? chalk.red(status)
      : status >= 400
      ? chalk.yellow(status)
      : status >= 300
      ? chalk.cyan(status)
      : chalk.green(status);

  const method = chalk.blue(tokens.method(req, res));
  const url = chalk.white(tokens.url(req, res));
  const responseTime = chalk.magenta(`${tokens["response-time"](req, res)} ms`);
  const time = chalk.gray(tokens.date(req, res, "iso"));

  return `${time} ${method} ${url} ${statusColor} - ${responseTime}`;
};

const stream = {
  write: (message) => logger.http(message.trim()),
};

const morganMiddleware = morgan(customFormat, { stream });

export default morganMiddleware;
