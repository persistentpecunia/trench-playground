import axios from "axios";
import logger from "../../logger/index.js";
import { fetch_token_dto } from "../dto/token-details.js";

const pumpfun_api = axios.create({
  baseURL: "https://pump.fun/api",
  timeout: 3000,
});

const phantom_api = axios.create({
  baseURL: "https://api.phantom.app",
  timeout: 3000,
});

const birdeye_api = axios.create({
  baseURL: "https://birdeye-proxy.jup.ag",
  timeout: 3000,
});

const retry_request = async (fn, retries = 3, delay = 2000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      logger.error(`Attempt ${i} failed: ${err.message}`);
      if (i < retries) await new Promise((res) => setTimeout(res, delay * i));
    }
  }
  return null;
};

export const phantom_fetch_token = async (token) =>
  retry_request(async () => {
    const { data } = await phantom_api.get(
      `/tokens/v1/solana:101/address/${token}`
    );
    return data?.data || null;
  });

export const birdeye_fetch_token = async (token) =>
  retry_request(async () => {
    const { data } = await birdeye_api.get(
      `/defi/token_overview?address=${token}`
    );
    return data?.data || null;
  });

const fetch_pumpfun_runners = async () =>
  retry_request(async () => {
    const { data } = await pumpfun_api.get("/runners");
    return data || [];
  });

export const fetch_enriched_runners = async () => {
  const runners = await fetch_pumpfun_runners();
  if (!runners.length) return [];

  const enriched = await Promise.allSettled(
    runners.map(async (runner) => {
      const token_details = await phantom_fetch_token(runner?.coin?.mint);
      const birdeye_details = await birdeye_fetch_token(runner?.coin?.mint);

      const token_details_combined = fetch_token_dto({
        ...token_details,
        birdeye: {...birdeye_details},
        pump_fun: runner?.coin,
      });
      // console.dir(token_details_combined);
      return token_details_combined;
    })
  );

  return enriched
    .filter(({ status }) => status === "fulfilled")
    .map(({ value }) => value);
};
