import Redis from "ioredis";

const { NODE_ENV, REDIS_URL } = process.env;

export const redis =
  NODE_ENV === "production"
    ? new Redis(REDIS_URL)
    : new Redis();