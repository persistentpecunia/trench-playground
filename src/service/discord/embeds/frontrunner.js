import { EmbedBuilder } from "@discordjs/builders";
import logger from "../../../lib/logger/index.js";

const fmt = (label, value) => `• ${label}: **${value}**`;

const bool = (label, condition) =>
  `• ${label}: ${condition ? "**✅**" : "**❌**"}`;

const format_links = (links) =>
  links.map((link) => `[${link.label}](${link.url})`).join(" • ");

const build_embed = (transaction, channelId) => {
  const { swap, token_details } = transaction;
  const { sol_amount, other_token } = swap || {};
  const {
    meta = {},
    metrics = {},
    securities = {},
    birdeye = {},
  } = token_details || {};

  const links = [
    {
      label: "AXIOM",
      url: `https://axiom.trade/t/${token_details.mint}/@pecunia33`,
    },
    { label: "PUMPFUN", url: `https://pump.fun/coin/${token_details.mint}` },
    {
      label: "DEXSCREENER",
      url: `https://dexscreener.com/solana/${token_details.mint}`,
    },
    {
      label: "PHANTOM",
      url: `https://phantom.com/tokens/solana/${token_details.mint}?referralId=im08fbm452k`,
    },
  ];

  const descriptionLines = [
    fmt(
      "TOKEN",
      `[${meta.name || "N/A"} (${meta.symbol || "?"})](${
        meta.dexscreener?.links?.pumpfun || "#"
      })`
    ),
    fmt("MINT", `\`${token_details.mint || "N/A"}\``),
    "",
    fmt(
      "ORDER",
      `${sol_amount?.toFixed(2) || "0.00"} SOL (~$${
        other_token?.usd?.toFixed(2) || "0.00"
      })`
    ),
    fmt(
      "TOKENS",
      `${other_token?.amount?.toLocaleString() || "0"} ${meta.symbol || ""}`
    ),
    "",
    fmt("MARKET CAP", birdeye.market_cap?.display || "N/A"),
    fmt("LIQUIDITY", birdeye.liquidity?.display || "N/A"),
    fmt("24H VOLUME", metrics.volume_24h_usd?.display || "N/A"),
    "",
    bool("OWNERSHIP RENOUNCED", securities.ownership_renounced),
    bool("MINTABLE", securities.mintable),
    bool("FREEZABLE", securities.freezable),
    bool("METADATA LOCKED", !securities.mutable_metadata),
    fmt("PHANTOM_STATUS", meta.spam_status || "N/A"),
    "",
    fmt(
      "CREATED",
      `${securities.created_timestamp?.display || "N/A"} (${
        securities.created_timestamp?.relative || "N/A"
      })`
    ),
    "",
    format_links(links),
  ];

  // Add Discord invite only for specific channel
  if (channelId === "1329066649893994506") {
    descriptionLines.push(
      `\n[Join our Discord for More Insights](https://discord.gg/G9cW69T35r)`
    );
  }

  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setAuthor({ name: "TRENCHBOT VOLUME" })
    .setDescription(descriptionLines.join("\n"))
    .setTimestamp()
    .setThumbnail(meta.dexscreener?.images?.small_image || null)
    .setImage(meta.dexscreener?.images?.banner || null);
};

// Function to send the embed
export const send_frontrunner_token = async (client, transaction) => {
  const channels = [
    { id: "1339560229678874695", label: "Defi Elites" },
    { id: "1358567579655995423", label: "Trench Playground" },
    { id: "1329066649893994506", label: "Solana Memecoins" },
  ];

  for (const { id, label } of channels) {
    try {
      const channel = await client.channels.fetch(id);
      if (!channel?.isTextBased()) {
        logger.warn(`⚠️ Skipped non-text channel: ${label} (${id})`);
        continue;
      }
      const embed = build_embed(transaction, id);
      await channel.send({ embeds: [embed] });
      logger.info(`✅ Sent embed to ${label} (${id})`);
    } catch (err) {
      logger.error(`❌ Failed to send embed to ${label} (${id})`);
      console.error(err);
    }
  }
};