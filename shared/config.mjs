export const config = {
  baseUrl: process.env.BASE_URL,
  tableName: process.env.TABLE_NAME,
  codeLength: parseInt(process.env.CODE_LEN9GTH ?? "5"),
  discordWebhookUrl: /** @type {string} */ (process.env.DISCORD_WEBHOOK_URL)
};