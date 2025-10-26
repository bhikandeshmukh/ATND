// Environment variable validation

interface EnvConfig {
  GOOGLE_CLIENT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_SPREADSHEET_ID: string;
  JWT_SECRET: string;
  NODE_ENV: string;
}

function validateEnv(): EnvConfig {
  const required = [
    "GOOGLE_CLIENT_EMAIL",
    "GOOGLE_PRIVATE_KEY",
    "GOOGLE_SPREADSHEET_ID",
    "JWT_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("\n❌ Missing required environment variables:");
    missing.forEach(key => console.error(`   - ${key}`));
    console.error("\n📝 Setup Instructions:");
    console.error("   1. Copy .env.example to .env.local");
    console.error("   2. Run: node scripts/generate-jwt-secret.js");
    console.error("   3. Add Google Sheets credentials");
    console.error("   4. Create admin user in Google Sheets Employees tab\n");
    
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "Please check your .env.local file and follow the setup instructions."
    );
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    console.warn("⚠️  WARNING: JWT_SECRET should be at least 32 characters long!");
    console.warn("   Run: node scripts/generate-jwt-secret.js");
  }

  return {
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL!,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY!,
    GOOGLE_SPREADSHEET_ID: process.env.GOOGLE_SPREADSHEET_ID!,
    JWT_SECRET: jwtSecret,
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

export const env = validateEnv();
