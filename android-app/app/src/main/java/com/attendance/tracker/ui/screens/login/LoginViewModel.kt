package com.attendance.tracker.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.attendance.tracker.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val error: String? = null,
    val triggerGoogleSignIn: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    fun login(username: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            val result = authRepository.login(username, password)
            
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true
                    )
                },
                onFailure = { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = exception.message ?: "Login failed"
                    )
                }
            )
        }
    }
    
    fun signInWithGoogle() {
        // Trigger Google Sign-In flow in Activity
        _uiState.value = _uiState.value.copy(
            triggerGoogleSignIn = true,
            error = null
        )
    }
    
    fun onGoogleSignInTriggered() {
        _uiState.value = _uiState.value.copy(triggerGoogleSignIn = false)
    }
    
    fun handleGoogleSignInResult(
        googleId: String,
        email: String,
        displayName: String
    ) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            val result = authRepository.saveGoogleUser(googleId, email, displayName)
            
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true
                    )
                },
                onFailure = { exception ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = exception.message ?: "Google sign-in failed"
                    )
                }
            )
        }
    }
    
    fun onGoogleSignInError(errorMessage: String) {
        _uiState.value = _uiState.value.copy(
            isLoading = false,
            error = errorMessage
        )
    }
    
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
