import moment from "moment";
import eventbus from "../../../lib/client/eventbus.js";
import logger from "../../../lib/logger/index.js";

import {
  birdeye_fetch_token,
  phantom_fetch_token,
} from "../../../lib/backend/solana/web.js";
import { fetch_token_dto } from "../../../lib/backend/dto/token-details.js";

import {
  analyze_sol_swap,
  is_valid_swap,
  get_involved_tokens,
} from "../../../lib/backend/solana/swap-analyzer.js";

const get_token_age_days = (created_timestamp_raw) => {
  if (!created_timestamp_raw) return null;

  const created_at = moment.utc(created_timestamp_raw);
  const now = moment.utc();

  return now.diff(created_at, "days");
};

export const handle_transaction = async (tx) => {
  const { transaction, meta } = tx;

  if (!meta?.preTokenBalances?.length || !meta?.postTokenBalances?.length) {
    return;
  }

  try {
    const involved_tokens = get_involved_tokens(meta.preTokenBalances);
    const swap = analyze_sol_swap(meta);

    if (!is_valid_swap(swap, involved_tokens)) return;

    const token_raw = await phantom_fetch_token(swap.other_token.mint);
    const birdeye_details = await birdeye_fetch_token(swap.other_token.mint);
    const token_details = fetch_token_dto({
      ...token_raw,
      birdeye: { ...birdeye_details },
    });

    const usd_per_token = token_details?.birdeye?.price?.raw || 0;
    const token_amount = swap?.other_token?.amount || 0;

    swap.other_token.usd = usd_per_token * token_amount;

    const token_age_days = get_token_age_days(
      token_details?.securities?.created_timestamp?.raw
    );

    if (token_age_days == null || token_age_days > 5) return;

    eventbus.emit("new_frontrunner", {
      signature: transaction.signatures[0],
      swap: {
        sol_amount: swap.sol_amount,
        direction: swap.direction ? "buy" : "sell",
        other_token: swap.other_token,
        rates: swap.rates,
        fee_paid: swap.fee_paid,
      },
      token_details,
    });
  } catch (err) {
    logger.error("Error processing MEV bot transaction");
    console.error(err);
  }
};
