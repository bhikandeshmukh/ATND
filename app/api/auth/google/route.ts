import { NextRequest, NextResponse } from "next/server";
import { getAllEmployees } from "@/lib/firebase/employees";
import { generateToken } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential } = body;

    if (!credential) {
      return NextResponse.json(
        { error: "Missing Google credential" },
        { status: 400 }
      );
    }

    // Decode JWT token from Google
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const googleUser = JSON.parse(jsonPayload);
    const email = googleUser.email;
    const name = googleUser.name;

    // Find employee by email
    const employees = await getAllEmployees();
    const employee = employees.find(emp => 
      emp.email?.toLowerCase() === email.toLowerCase()
    );

    if (!employee) {
      return NextResponse.json(
        { error: "No employee account found with this Google email. Please contact admin." },
        { status: 401 }
      );
    }

    // Check if employee is active
    if (employee.status === 'inactive') {
      return NextResponse.json(
        { error: "Your account is inactive. Please contact admin." },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: employee.id || '',
      username: employee.username || employee.name,
      role: employee.role,
      name: employee.name,
    });

    return NextResponse.json({
      user: {
        id: employee.id || '',
        username: employee.username || employee.name,
        role: employee.role,
        name: employee.name,
      },
      token,
      expiresIn: "24h",
    });
  } catch (error) {
    console.error("Google login error:", error);
    return NextResponse.json(
      { error: "Google login failed. Please try again." },
      { status: 500 }
    );
  }
}
