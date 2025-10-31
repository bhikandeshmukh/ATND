/**
 * Firebase Firestore - Night Duty Operations
 */

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';

export interface NightDutyRequest {
  id?: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate?: string;
  requestedTime?: string;
  requestedBy?: string;
  approvedBy?: string;
  approvedDate?: string;
  approvedTime?: string;
  createdAt?: Date;
}

/**
 * Add a new night duty request to Firebase (employee-wise structure)
 */
export async function addNightDutyRequest(dutyData: Omit<NightDutyRequest, 'id'>): Promise<string> {
  try {
    const { employeeName, date, ...requestData } = dutyData;
    
    // Create/update employee document
    await setDoc(doc(db, 'nightDuty', employeeName), {
      employeeName: employeeName,
      lastUpdated: Timestamp.now(),
    }, { merge: true });

    // Use date as the request ID (one request per date per employee)
    const requestId = date;
    
    const now = new Date();
    const requestedTime = now.toLocaleTimeString('en-US', { hour12: true });
    
    // Add night duty request as subcollection
    await setDoc(doc(db, 'nightDuty', employeeName, 'requests', requestId), {
      '01_id': requestId,
      '02_date': date,
      '03_startTime': requestData.startTime,
      '04_endTime': requestData.endTime,
      '05_reason': requestData.reason || '',
      '06_status': requestData.status,
      '07_appliedDate': requestData.appliedDate || now.toISOString().split('T')[0],
      '08_requestedTime': requestedTime,
      '09_requestedBy': requestData.requestedBy || employeeName,
      '10_approvedBy': requestData.approvedBy || '',
      '11_approvedDate': requestData.approvedDate || '',
      '12_approvedTime': requestData.approvedTime || '',
      '13_createdAt': Timestamp.now(),
    });

    return requestId;
  } catch (error) {
    console.error('Error adding night duty request:', error);
    throw error;
  }
}

/**
 * Get all night duty requests from Firebase (employee-wise structure)
 */
export async function getAllNightDutyRequests(): Promise<NightDutyRequest[]> {
  try {
    const requests: NightDutyRequest[] = [];
    
    // Get all employees from nightDuty collection
    const employeesSnapshot = await getDocs(collection(db, 'nightDuty'));
    
    // For each employee, get their night duty requests
    for (const employeeDoc of employeesSnapshot.docs) {
      const employeeName = employeeDoc.id;
      const requestsRef = collection(db, 'nightDuty', employeeName, 'requests');
      const requestsSnapshot = await getDocs(requestsRef);
      
      requestsSnapshot.forEach((requestDoc) => {
        const data = requestDoc.data();
        requests.push({
          id: requestDoc.id,
          employeeName: employeeName,
          date: data['02_date'] || '',
          startTime: data['03_startTime'] || '',
          endTime: data['04_endTime'] || '',
          reason: data['05_reason'] || '',
          status: data['06_status'] || 'pending',
          appliedDate: data['07_appliedDate'] || '',
          requestedTime: data['08_requestedTime'] || '',
          requestedBy: data['09_requestedBy'] || '',
          approvedBy: data['10_approvedBy'] || '',
          approvedDate: data['11_approvedDate'] || '',
          approvedTime: data['12_approvedTime'] || '',
          createdAt: data['13_createdAt']?.toDate(),
        });
      });
    }
    
    // Sort by created date descending
    requests.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return requests;
  } catch (error) {
    console.error('Error fetching night duty requests:', error);
    throw error;
  }
}

/**
 * Get night duty requests for a specific employee (employee-wise structure)
 */
export async function getNightDutyByEmployee(employeeName: string): Promise<NightDutyRequest[]> {
  try {
    const requests: NightDutyRequest[] = [];
    const requestsRef = collection(db, 'nightDuty', employeeName, 'requests');
    const requestsSnapshot = await getDocs(requestsRef);
    
    requestsSnapshot.forEach((requestDoc) => {
      const data = requestDoc.data();
      requests.push({
        id: requestDoc.id,
        employeeName: employeeName,
        date: data['02_date'] || '',
        startTime: data['03_startTime'] || '',
        endTime: data['04_endTime'] || '',
        reason: data['05_reason'] || '',
        status: data['06_status'] || 'pending',
        appliedDate: data['07_appliedDate'] || '',
        requestedTime: data['08_requestedTime'] || '',
        requestedBy: data['09_requestedBy'] || '',
        approvedBy: data['10_approvedBy'] || '',
        approvedDate: data['11_approvedDate'] || '',
        approvedTime: data['12_approvedTime'] || '',
        createdAt: data['13_createdAt']?.toDate(),
      });
    });
    
    // Sort by created date descending
    requests.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return requests;
  } catch (error) {
    console.error('Error fetching employee night duty requests:', error);
    throw error;
  }
}

/**
 * Update night duty request status (employee-wise structure)
 */
export async function updateNightDutyStatus(
  dutyId: string,
  status: 'approved' | 'rejected',
  approvedBy?: string
): Promise<void> {
  try {
    // Find the night duty request across all employees
    const employeesSnapshot = await getDocs(collection(db, 'nightDuty'));
    
    for (const employeeDoc of employeesSnapshot.docs) {
      const employeeName = employeeDoc.id;
      const requestRef = doc(db, 'nightDuty', employeeName, 'requests', dutyId);
      const requestSnap = await getDoc(requestRef);
      
      if (requestSnap.exists()) {
        const now = new Date();
        await updateDoc(requestRef, {
          '06_status': status,
          '10_approvedBy': approvedBy || '',
          '11_approvedDate': now.toISOString().split('T')[0],
          '12_approvedTime': now.toLocaleTimeString('en-US', { hour12: true }),
        });
        return;
      }
    }
    
    throw new Error('Night duty request not found');
  } catch (error) {
    console.error('Error updating night duty status:', error);
    throw error;
  }
}
