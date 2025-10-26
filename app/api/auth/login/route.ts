import { NextRequest, NextResponse } from "next/server";
import { authenticateEmployee } from "@/lib/employees";
import { generateToken } from "@/lib/security";
import { validateData, loginSchema } from "@/lib/validation";
import { checkRateLimit, clearRateLimit, sanitizeInput } from "@/lib/security";
import { addSecurityHeaders } from "@/lib/middleware";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validateData(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { username, password } = validation.data!;
    const sanitizedUsername = sanitizeInput(username);

    // Rate limiting - 5 attempts per 15 minutes per username
    const rateLimitKey = `login:${sanitizedUsername}`;
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // Authenticate from Google Sheets (all users including admins)
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "System configuration error. Please contact administrator." },
        { status: 500 }
      );
    }

    const user = await authenticateEmployee(spreadsheetId, sanitizedUsername, password);
    
    if (user) {
      clearRateLimit(rateLimitKey);
      const token = generateToken({
        userId: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      });

      const response = NextResponse.json({
        user: user,
        token,
        expiresIn: "24h",
      });
      
      return addSecurityHeaders(response);
    }

    // Invalid credentials
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
