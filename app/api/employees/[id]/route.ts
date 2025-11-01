import { NextRequest, NextResponse } from "next/server";
import { setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, position, role, status, totalWorkingDays, fixedInTime, fixedOutTime, perMinuteRate, fixedSalary, username, password } = body;

    const employeeId = params.id;

    // Prepare update data
    const updateData: any = {
      '02_name': name,
      '03_position': position || '',
      '04_role': role || 'user',
      '05_status': status || 'active',
      '06_totalWorkingDays': parseInt(totalWorkingDays) || 26,
      '07_fixedInTime': fixedInTime || '09:00:00 AM',
      '08_fixedOutTime': fixedOutTime || '07:00:00 PM',
      '09_perMinuteRate': parseFloat(perMinuteRate) || 0,
      '10_fixedSalary': parseFloat(fixedSalary) || 0,
      '11_username': username || '',
    };

    // Only update password if provided
    if (password && password.trim()) {
      updateData['12_password'] = password;
    }

    // Use setDoc with merge to create or update (prevents NOT_FOUND error)
    await setDoc(doc(db, 'employees', employeeId), updateData, { merge: true });

    console.log(`✅ Employee ${employeeId} updated successfully`);
    
    return NextResponse.json({ success: true, message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}
