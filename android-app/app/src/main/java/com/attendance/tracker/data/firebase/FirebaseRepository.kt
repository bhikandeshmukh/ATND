package com.attendance.tracker.data.firebase

import com.attendance.tracker.data.model.*
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseRepository @Inject constructor() {
    
    private val firestore = FirebaseFirestore.getInstance()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val timeFormat = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())
    
    // ==================== EMPLOYEES ====================
    
    suspend fun getEmployees(): Result<List<Employee>> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.EMPLOYEES_COLLECTION)
                .get()
                .await()
            
            val employees = snapshot.documents.mapNotNull { doc ->
                doc.toObject(Employee::class.java)?.copy(id = doc.id)
            }
            Result.success(employees)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getEmployeeByUsername(username: String): Employee? {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.EMPLOYEES_COLLECTION)
                .whereEqualTo("username", username)
                .get()
                .await()
            
            snapshot.documents.firstOrNull()?.toObject(Employee::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    suspend fun addEmployee(employee: Employee): Result<Employee> {
        return try {
            val docRef = firestore.collection(FirebaseConfig.EMPLOYEES_COLLECTION)
                .add(employee)
                .await()
            Result.success(employee.copy(id = docRef.id))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    
    // ==================== ATTENDANCE ====================
    
    suspend fun getAttendance(): Result<List<AttendanceRecord>> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.ATTENDANCE_COLLECTION)
                .orderBy("date", Query.Direction.DESCENDING)
                .get()
                .await()
            
            val records = snapshot.documents.mapNotNull { doc ->
                doc.toObject(AttendanceRecord::class.java)?.copy(id = doc.id)
            }
            Result.success(records)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getAttendanceByEmployee(employeeName: String, date: String): AttendanceRecord? {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.ATTENDANCE_COLLECTION)
                .whereEqualTo("employeeName", employeeName)
                .whereEqualTo("date", date)
                .get()
                .await()
            
            snapshot.documents.firstOrNull()?.toObject(AttendanceRecord::class.java)
        } catch (e: Exception) {
            null
        }
    }
    
    suspend fun checkIn(
        employeeName: String,
        date: String,
        inTime: String,
        inLocation: String,
        isNightDuty: Boolean = false
    ): Result<AttendanceRecord> {
        return try {
            val record = AttendanceRecord(
                employeeName = employeeName,
                date = date,
                inTime = inTime,
                inLocation = inLocation,
                isNightDuty = isNightDuty
            )
            
            val docRef = firestore.collection(FirebaseConfig.ATTENDANCE_COLLECTION)
                .add(record)
                .await()
            
            Result.success(record.copy(id = docRef.id))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun checkOut(
        employeeName: String,
        date: String,
        outTime: String,
        outLocation: String
    ): Result<AttendanceRecord> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.ATTENDANCE_COLLECTION)
                .whereEqualTo("employeeName", employeeName)
                .whereEqualTo("date", date)
                .get()
                .await()
            
            val doc = snapshot.documents.firstOrNull()
                ?: return Result.failure(Exception("No check-in found"))
            
            doc.reference.update(
                mapOf(
                    "outTime" to outTime,
                    "outLocation" to outLocation
                )
            ).await()
            
            val updated = doc.toObject(AttendanceRecord::class.java)?.copy(
                id = doc.id,
                outTime = outTime,
                outLocation = outLocation
            )
            
            Result.success(updated!!)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    
    // ==================== LEAVES ====================
    
    suspend fun getLeaves(): Result<List<LeaveRecord>> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.LEAVES_COLLECTION)
                .orderBy("appliedDate", Query.Direction.DESCENDING)
                .get()
                .await()
            
            val leaves = snapshot.documents.mapNotNull { doc ->
                doc.toObject(LeaveRecord::class.java)?.copy(id = doc.id)
            }
            Result.success(leaves)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun applyLeave(
        employeeName: String,
        leaveType: String,
        startDate: String,
        endDate: String,
        reason: String
    ): Result<LeaveRecord> {
        return try {
            val leave = LeaveRecord(
                employeeName = employeeName,
                leaveType = leaveType,
                startDate = startDate,
                endDate = endDate,
                reason = reason,
                status = LeaveStatus.PENDING,
                appliedDate = dateFormat.format(Date())
            )
            
            val docRef = firestore.collection(FirebaseConfig.LEAVES_COLLECTION)
                .add(leave)
                .await()
            
            Result.success(leave.copy(id = docRef.id))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateLeaveStatus(
        id: String,
        status: String,
        approvedBy: String? = null
    ): Result<LeaveRecord> {
        return try {
            val updates = mutableMapOf<String, Any>(
                "status" to status
            )
            approvedBy?.let { 
                updates["approvedBy"] = it
                updates["approvedDate"] = dateFormat.format(Date())
                updates["approvedTime"] = timeFormat.format(Date())
            }
            
            firestore.collection(FirebaseConfig.LEAVES_COLLECTION)
                .document(id)
                .update(updates)
                .await()
            
            val doc = firestore.collection(FirebaseConfig.LEAVES_COLLECTION)
                .document(id)
                .get()
                .await()
            
            val leave = doc.toObject(LeaveRecord::class.java)?.copy(id = doc.id)
            Result.success(leave!!)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // ==================== NIGHT DUTY ====================
    
    suspend fun getNightDutyRequests(): Result<List<NightDutyRequest>> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.NIGHT_DUTY_COLLECTION)
                .orderBy("requestedAt", Query.Direction.DESCENDING)
                .get()
                .await()
            
            val requests = snapshot.documents.mapNotNull { doc ->
                doc.toObject(NightDutyRequest::class.java)?.copy(id = doc.id)
            }
            Result.success(requests)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun requestNightDuty(
        employeeName: String,
        date: String,
        reason: String
    ): Result<NightDutyRequest> {
        return try {
            val request = NightDutyRequest(
                employeeName = employeeName,
                date = date,
                reason = reason,
                status = "pending",
                requestedAt = dateFormat.format(Date())
            )
            
            val docRef = firestore.collection(FirebaseConfig.NIGHT_DUTY_COLLECTION)
                .add(request)
                .await()
            
            Result.success(request.copy(id = docRef.id))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateNightDutyStatus(
        id: String,
        status: String,
        approvedBy: String? = null
    ): Result<NightDutyRequest> {
        return try {
            val updates = mutableMapOf<String, Any>("status" to status)
            approvedBy?.let { updates["approvedBy"] = it }
            
            firestore.collection(FirebaseConfig.NIGHT_DUTY_COLLECTION)
                .document(id)
                .update(updates)
                .await()
            
            val doc = firestore.collection(FirebaseConfig.NIGHT_DUTY_COLLECTION)
                .document(id)
                .get()
                .await()
            
            val request = doc.toObject(NightDutyRequest::class.java)?.copy(id = doc.id)
            Result.success(request!!)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    // ==================== NOTIFICATIONS ====================
    
    suspend fun getNotifications(userId: String): Result<List<Notification>> {
        return try {
            val snapshot = firestore.collection(FirebaseConfig.NOTIFICATIONS_COLLECTION)
                .whereEqualTo("userId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .await()
            
            val notifications = snapshot.documents.mapNotNull { doc ->
                doc.toObject(Notification::class.java)?.copy(id = doc.id)
            }
            Result.success(notifications)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun markNotificationRead(id: String): Result<Unit> {
        return try {
            firestore.collection(FirebaseConfig.NOTIFICATIONS_COLLECTION)
                .document(id)
                .update("read", true)
                .await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
