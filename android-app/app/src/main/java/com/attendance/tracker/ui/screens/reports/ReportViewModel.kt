package com.attendance.tracker.ui.screens.reports

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.attendance.tracker.data.model.AttendanceRecord
import com.attendance.tracker.data.model.UserRole
import com.attendance.tracker.data.repository.AttendanceRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReportUiState(
    val isLoading: Boolean = false,
    val records: List<AttendanceRecord> = emptyList(),
    val totalDays: Int = 0,
    val presentDays: Int = 0,
    val totalHours: Int = 0,
    val totalEarning: Double = 0.0,
    val error: String? = null
)

@HiltViewModel
class ReportViewModel @Inject constructor(
    private val attendanceRepository: AttendanceRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ReportUiState())
    val uiState: StateFlow<ReportUiState> = _uiState.asStateFlow()
    
    private var userName: String = ""
    private var userRole: UserRole = UserRole.USER
    
    fun initialize(name: String, role: UserRole) {
        userName = name
        userRole = role
        loadReports()
    }
    
    private fun loadReports() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            val result = attendanceRepository.getAttendance()
            
            result.fold(
                onSuccess = { records ->
                    val filteredRecords = if (userRole == UserRole.USER) {
                        records.filter { it.employeeName == userName }
                    } else {
                        records
                    }
                    
                    val sortedRecords = filteredRecords.sortedByDescending { it.date }
                    val totalMinutes = filteredRecords.sumOf { it.totalMinutes }
                    
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        records = sortedRecords,
                        totalDays = 30, // Current month days
                        presentDays = filteredRecords.size,
                        totalHours = totalMinutes / 60,
                        totalEarning = 0.0 // Calculate based on employee rate
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }
}
