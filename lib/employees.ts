/**
 * Employee Management - Firebase Wrapper
 * This file provides backward compatibility with existing code
 */

import { Employee } from "./types";
import { 
  getAllEmployees as getFirebaseEmployees, 
  addEmployee as addFirebaseEmployee, 
  deleteEmployee as deleteFirebaseEmployee, 
  getEmployeeByUsername as getFirebaseEmployeeByUsername 
} from "./firebase/employees";

/**
 * Get all employees from Firebase
 */
export async function getEmployees(spreadsheetId?: string): Promise<Employee[]> {
  return await getFirebaseEmployees();
}

/**
 * Add a new employee to Firebase
 */
export async function addEmployee(spreadsheetId: string, employee: Omit<Employee, "id">): Promise<string> {
  // No password hashing - store plain text
  return await addFirebaseEmployee(employee);
}

/**
 * Delete an employee from Firebase
 */
export async function deleteEmployee(spreadsheetId: string, employeeId: string): Promise<void> {
  await deleteFirebaseEmployee(employeeId);
}

/**
 * Authenticate employee by username and password
 * Supports both old (with spreadsheetId) and new (without) signatures for backward compatibility
 */
export async function authenticateEmployee(
  usernameOrSpreadsheetId: string,
  passwordOrUsername?: string,
  passwordIfThreeParams?: string
): Promise<Employee | null> {
  try {
    // Determine which signature is being used
    let username: string;
    let password: string;
    
    if (passwordIfThreeParams !== undefined) {
      // Old signature: authenticateEmployee(spreadsheetId, username, password)
      username = passwordOrUsername!;
      password = passwordIfThreeParams;
    } else {
      // New signature: authenticateEmployee(username, password)
      username = usernameOrSpreadsheetId;
      password = passwordOrUsername!;
    }

    const employee = await getFirebaseEmployeeByUsername(username);
    
    if (!employee) {
      console.log(`❌ Employee not found: ${username}`);
      return null;
    }

    // Direct password comparison (no hashing)
    if (employee.password !== password) {
      console.log(`❌ Invalid password for: ${username}`);
      return null;
    }

    console.log(`✅ Authentication successful for: ${username}`);
    return employee;
  } catch (error) {
    console.error("Error authenticating employee:", error);
    return null;
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(spreadsheetId: string, employeeId: string): Promise<Employee | null> {
  const employees = await getFirebaseEmployees();
  return employees.find(emp => emp.id === employeeId) || null;
}

/**
 * Update employee (for backward compatibility)
 */
export async function updateEmployee(spreadsheetId: string, employeeId: string, updates: Partial<Employee>): Promise<void> {
  // This would need to be implemented in firebase/employees.ts if needed
  console.warn("updateEmployee not yet implemented for Firebase");
}
