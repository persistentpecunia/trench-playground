import moment from "moment";

const format_number = (num) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  }).format(num);

const format_percentage = (num) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(num / 100);

const format_timestamp = (timestamp) => {
  const utc_time = moment.utc(timestamp);

  return {
    raw: timestamp,
    display: utc_time.format("D MMM 'YY · h:mmA"),
    relative: utc_time.fromNow(),
  };
};

export const fetch_token_dto = (token) => ({
  mint: token.address,
  meta: {
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    image_uri: token.logoURI,
    spam_status: token.spamStatus,
    dexscreener: {
      images: {
        small_image: `https://dd.dexscreener.com/ds-data/tokens/solana/${token.address}.png?size=xl&key=655313`,
        banner: `https://dd.dexscreener.com/ds-data/tokens/solana/${token.address}/header.png?size=xl&key=655313`,
      },
      links: {
        pumpfun: `https://pump.fun/coin/${token.address}`,
      },
    },
  },

  ...(token.pump_fun && {
    pump_fun: {
      creator: token.pump_fun.creator,
      created_timestamp: format_timestamp(token.pump_fun.created_timestamp),

      complete: token.pump_fun.complete,
      king_of_the_hill_timestamp: format_timestamp(
        token.pump_fun.king_of_the_hill_timestamp
      ),
      reply_count: {
        raw: token.pump_fun.reply_count,
        display: format_number(token.pump_fun.reply_count),
      },
      last_reply: format_timestamp(token.pump_fun.last_reply),
      twitter: token.pump_fun.twitter,
      telegram: token.pump_fun.telegram,
      website: token.pump_fun.website,

      market_cap: {
        raw: token.pump_fun.usd_market_cap,
        display: format_number(token.pump_fun.usd_market_cap)
      },
    },
  }),

  birdeye: {
    market_cap: {
      raw: token.birdeye.marketCap,
      display: format_number(token.birdeye.marketCap)
    },
    liquidity: {
      raw: token.birdeye.liquidity,
      display: format_number(token.birdeye.liquidity)
    },
    fdv: {
      raw: token.birdeye.fdv,
      display: format_number(token.birdeye.fdv),
    },
    holder: {
      raw: token.birdeye.holder,
      display: format_number(token.birdeye.holder),
    },
    price: {
      raw: token.birdeye.price,
      display: format_number(token.birdeye.price),
    }
  },

  metrics: {
    market_cap: {
      raw: token.marketCap,
      display: format_number(token.marketCap),
    },
    liquidity: {
      raw: token.liquidity,
      display: format_number(token.liquidity),
    },
    usd_per_token: {
      raw: token.marketCap / token.circulatingSupply,
      display: format_number(token.marketCap / token.circulatingSupply),
    },
    holders: {
      raw: token.holders || "N/A",
      display: format_number(Math.max(token.holders, 0)) || "N/A",
    },
    volume_24h_usd: {
      raw: token.volume24hUSD,
      display: format_number(token.volume24hUSD),
    },
    trades_24h: {
      raw: token.trades24h,
      display: format_number(token.trades24h),
    },
    unique_wallets_24h: {
      raw: token.uniqueWallets24h,
      display: format_number(token.uniqueWallets24h),
    },
    top_10_holders_percent: {
      raw: token.top10HoldersPercent ?? "N/A",
      display:
        token.top10HoldersPercent != null
          ? format_percentage(token.top10HoldersPercent)
          : "N/A",
    },
  },

  securities: {
    mintable: token.mintable,
    freezable: token.freezable,
    mutable_metadata: token.mutableMetadata,
    ownership_renounced: token.ownershipRenounced,
    created_timestamp: format_timestamp(token.createdDate),
  },
});
