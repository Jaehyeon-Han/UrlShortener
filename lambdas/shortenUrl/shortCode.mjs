import { config } from "../../shared/config.mjs";

// Base 62 기반, 62^n >= 1000개 지원이 목표이나 초기값 넉넉히 n=5로 916,132,832개까지
const LENGTH = config.codeLength;

export default function generateCode() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < LENGTH; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
