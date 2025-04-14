const WSOL = "So11111111111111111111111111111111111111112";

const to_decimal = (amount, decimals) => amount / 10 ** decimals;

const get_token_balance_change = (pre, post) => {
  const decimals = pre?.uiTokenAmount.decimals || post?.uiTokenAmount.decimals || 0;
  return to_decimal(
    Number(BigInt(post?.uiTokenAmount.amount || 0) - BigInt(pre?.uiTokenAmount.amount || 0)),
    decimals
  );
};

export const get_involved_tokens = (balances) => [...new Set(balances?.map((b) => b.mint) || [])];

const calculate_rates = (sol_change, token_change) =>
  sol_change && token_change
    ? {
        sol_per_token: Math.abs(token_change) / Math.abs(sol_change),
        token_per_sol: Math.abs(sol_change) / Math.abs(token_change),
      }
    : { sol_per_token: 0, token_per_sol: 0 };

const find_token_balance = (balances, mint) => balances.find((b) => b.mint === mint);

export const analyze_sol_swap = (meta) => {
  if (!meta?.preTokenBalances?.length || !meta?.postTokenBalances?.length) return { involved: false };

  const sol_balance = find_token_balance(meta.preTokenBalances, WSOL);
  const other_token = meta.preTokenBalances.find((b) => b.mint !== WSOL);

  if (!sol_balance || !other_token) return { involved: false };

  const sol_change = get_token_balance_change(sol_balance, find_token_balance(meta.postTokenBalances, WSOL));
  if (sol_change === 0) return { involved: false };

  const other_token_change = get_token_balance_change(
    other_token,
    find_token_balance(meta.postTokenBalances, other_token.mint)
  );

  return {
    involved: true,
    sol_amount: Math.abs(sol_change),
    direction: sol_change > 0,
    other_token: {
      mint: other_token.mint,
      decimals: other_token.uiTokenAmount.decimals,
      amount: Math.abs(other_token_change),
    },
    rates: calculate_rates(sol_change, other_token_change),
    fee_paid: meta.fee,
  };
};

export const is_valid_swap = (swap_analysis, involved_tokens) =>
  swap_analysis.involved && swap_analysis.direction && involved_tokens.length > 1 && swap_analysis.sol_amount > 0.5;
