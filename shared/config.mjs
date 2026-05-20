export const config = {
  baseUrl: process.env.BASE_URL,
  tableName: process.env.TABLE_NAME,
  codeLength: parseInt(process.env.CODE_LENGTH ?? "5")
};