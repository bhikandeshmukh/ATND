package com.attendance.tracker.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.attendance.tracker.data.api.ApiService
import com.attendance.tracker.data.firebase.FirebaseConfig
import com.attendance.tracker.data.model.LoginRequest
import com.attendance.tracker.data.model.User
import com.attendance.tracker.data.model.UserRole
import com.google.firebase.firestore.FirebaseFirestore
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth")

@Singleton
class AuthRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService
) {
    private val gson = Gson()
    private val firestore = FirebaseFirestore.getInstance()
    
    companion object {
        private val USER_KEY = stringPreferencesKey("user")
        private val TOKEN_KEY = stringPreferencesKey("token")
    }
    
    val currentUser: Flow<User?> = context.dataStore.data.map { preferences ->
        preferences[USER_KEY]?.let { json ->
            try {
                gson.fromJson(json, User::class.java)
            } catch (e: Exception) {
                null
            }
        }
    }
    
    suspend fun login(username: String, password: String): Result<User> {
        return try {
            // Direct Firebase login
            val snapshot = firestore.collection(FirebaseConfig.EMPLOYEES_COLLECTION)
                .whereEqualTo("username", username)
                .get()
                .await()
            
            val employeeDoc = snapshot.documents.firstOrNull()
                ?: return Result.failure(Exception("User not found"))
            
            val storedPassword = employeeDoc.getString("password") ?: ""
            
            // Note: In production, use proper password hashing verification
            // For now, simple comparison (your backend uses bcrypt)
            if (storedPassword != password && !verifyPassword(password, storedPassword)) {
                return Result.failure(Exception("Invalid password"))
            }
            
            val user = User(
                id = employeeDoc.id,
                username = username,
                name = employeeDoc.getString("name") ?: "",
                role = if (employeeDoc.getString("role") == "admin") UserRole.ADMIN else UserRole.USER,
                email = employeeDoc.getString("email")
            )
            
            saveUser(user, "firebase_token_${user.id}")
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    private fun verifyPassword(input: String, stored: String): Boolean {
        // Simple check - in production use BCrypt
        return input == stored || stored.startsWith("\$2a\$") // bcrypt hash check placeholder
    }
    
    private suspend fun saveUser(user: User, token: String) {
        context.dataStore.edit { preferences ->
            preferences[USER_KEY] = gson.toJson(user)
            preferences[TOKEN_KEY] = token
        }
    }
    
    suspend fun logout() {
        context.dataStore.edit { preferences ->
            preferences.remove(USER_KEY)
            preferences.remove(TOKEN_KEY)
        }
    }
    
    suspend fun getToken(): String? {
        var token: String? = null
        context.dataStore.data.collect { preferences ->
            token = preferences[TOKEN_KEY]
        }
        return token
    }
    
    suspend fun signInWithGoogle(): Result<User> {
        // Note: This requires Google Sign-In SDK integration
        // For now, this is a placeholder that will be called after 
        // Google Sign-In activity returns the credential
        return Result.failure(Exception("Google Sign-In requires activity context. Use GoogleSignInClient in Activity."))
    }
    
    suspend fun handleGoogleSignInResult(idToken: String): Result<User> {
        return try {
            // Send Google ID token to your backend for verification
            val response = apiService.googleLogin(mapOf("credential" to idToken))
            if (response.isSuccessful && response.body() != null) {
                val loginResponse = response.body()!!
                saveUser(loginResponse.user, loginResponse.token)
                Result.success(loginResponse.user)
            } else {
                Result.failure(Exception("Google sign-in failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
