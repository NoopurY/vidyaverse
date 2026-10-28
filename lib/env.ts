/** Centralised, lazily-validated access to environment variables (server only). */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}. Run "npm run keys" and fill .env (see .env.example).`);
  return v;
}

export const env = {
  get mongoUri() {
    return required("MONGODB_URI");
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get hmacSecret() {
    return required("HMAC_SECRET");
  },
  get fieldKey() {
    return required("FIELD_ENCRYPTION_KEY");
  },
  get signingPrivateKey() {
    return required("SIGNING_PRIVATE_KEY");
  },
  get signingPublicKey() {
    return required("SIGNING_PUBLIC_KEY");
  },
  get appDomain() {
    // explicit domain, else Vercel's production / deployment host, else local dev
    return process.env.APP_DOMAIN || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "localhost:3000";
  },
  get appUrl() {
    const d = this.appDomain;
    return d.startsWith("localhost") || d.startsWith("127.0.0.1") ? `http://${d}` : `https://${d}`;
  },
  get whatsapp() {
    return {
      token: process.env.WHATSAPP_TOKEN,
      phoneId: process.env.WHATSAPP_PHONE_ID,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
      appSecret: process.env.WHATSAPP_APP_SECRET,
    };
  },
  get llm() {
    return {
      apiKey: process.env.LLM_API_KEY,
      baseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
      model: process.env.LLM_MODEL || "gpt-4o-mini",
    };
  },
  get cronSecret() {
    return process.env.CRON_SECRET;
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};
