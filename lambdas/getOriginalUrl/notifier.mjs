import { config } from "../../shared/config.mjs";

/** @param {string} clicked */
export async function notifyDiscord(clicked) {
  await fetch(config.discordWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: `clicked: ${clicked}` })
  });
}