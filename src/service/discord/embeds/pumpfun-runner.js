import { EmbedBuilder } from "@discordjs/builders";
import logger from "../../../lib/logger/index.js";

const fmt = (label, value) => `• ${label}: **${value}**`;
const bool = (label, condition) =>
  `• ${label}: ${condition ? "**✅**" : "**❌**"}`;
const format_links = (links) =>
  links.map((link) => `[${link.label}](${link.url})`).join(" • ");

const build_embed = (token) => {
  const { mint, meta, metrics, securities, pump_fun, birdeye } = token;

  const links = [
    {
      label: "AXIOM",
      url: `https://axiom.trade/t/${mint}/@pecunia33`,
    },
    { label: "PUMPFUN", url: `https://pump.fun/coin/${mint}` },
    { label: "DEXSCREENER", url: `https://dexscreener.com/solana/${mint}` },
    {
      label: "PHANTOM",
      url: `https://phantom.com/tokens/solana/${mint}?referralId=im08fbm452k`,
    },
  ];

  const base_description = [
    fmt("TOKEN", `[${meta.name} (${meta.symbol})](${links[1].url})`),
    `\`${mint}\``,
    "",

    fmt("MARKET CAP", birdeye.market_cap.display),
    fmt("LIQUIDITY", birdeye.liquidity.display),
    // fmt("HOLDERS", metrics.holders.display),
    fmt("24H VOLUME", metrics.volume_24h_usd.display),
    fmt("TOP HOLDERS", metrics.top_10_holders_percent.display),
    "",

    bool("OWNERSHIP RENOUNCED", securities.ownership_renounced),
    bool("MINTABLE", securities.mintable),
    bool("FREEZABLE", securities.freezable),
    bool("METADATA LOCKED", securities.mutable_metadata),
    fmt("PHANTOM STATUS", meta.spam_status),
    "",

    fmt(
      "CREATED",
      `${pump_fun.created_timestamp.display} (${pump_fun.created_timestamp.relative})`
    ),
    "",
  ];

  const pump_fun_description = pump_fun
    ? [
        fmt("CREATOR", pump_fun.creator),
        fmt("REPLIES", pump_fun.reply_count.display),
        fmt(
          "LAST REPLY",
          `${pump_fun.last_reply.display} (${pump_fun.last_reply.relative})`
        ),
        fmt(
          "KOTH",
          `${pump_fun.king_of_the_hill_timestamp.display} (${pump_fun.king_of_the_hill_timestamp.relative})`
        ),
        "",
      ]
    : [];

  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setAuthor({ name: "TRENCHBOT VOLUME" })
    .setDescription(
      [...base_description, ...pump_fun_description, format_links(links)].join(
        "\n"
      )
    )
    .setTimestamp()
    .setThumbnail(meta.dexscreener.images.small_image)
    .setImage(meta.dexscreener.images.banner);
};

export const send_pumpfun_runner_token = async (client, token) => {
  const channels = [
    { id: "1353555369925804085", label: "Defi Elites" },
    { id: "1358567694512820260", label: "Trench Playground" },
  ];

  const embed = build_embed(token);

  for (const { id, label } of channels) {
    try {
      const channel = await client.channels.fetch(id);
      if (!channel?.isTextBased()) {
        logger.warn(`⚠️ Skipped non-text channel: ${label} (${id})`);
        continue;
      }

      await channel.send({ embeds: [embed] });
      logger.info(`✅ Sent Pumpfun embed to ${label} (${id})`);
    } catch (err) {
      logger.error(`❌ Failed to send Pumpfun embed to ${label} (${id})`);
      console.error(err);
    }
  }
};
