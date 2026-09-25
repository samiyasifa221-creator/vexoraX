package com.aegis.rewards.app.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

/**
 * 28. FIREBASE AUTHENTICATION ARCHITECTURE
 * Centrally managed AuthState, AuthRepository, and AuthViewModel
 */

// -------------------------------------------------------------
// AuthState
// -------------------------------------------------------------
sealed class AuthState {
    object Unauthenticated : AuthState()
    object Authenticating : AuthState()
    data class Authenticated(val user: FirebaseUser) : AuthState()
    data class EmailVerificationRequired(val user: FirebaseUser) : AuthState()
    data class Error(val message: String, val code: String? = null) : AuthState()
}

// -------------------------------------------------------------
// AuthRepository
// -------------------------------------------------------------
class AuthRepository(
    private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    val currentUser: FirebaseUser?
        get() = firebaseAuth.currentUser

    suspend fun registerWithEmail(email: String, password: String): Result<FirebaseUser> {
        return runCatching {
            val result = firebaseAuth.createUserWithEmailAndPassword(email, password).await()
            val user = result.user ?: throw IllegalStateException("Firebase user was null after registration")
            // Send verification email immediately
            user.sendEmailVerification().await()
            user
        }
    }

    suspend fun loginWithEmail(email: String, password: String): Result<FirebaseUser> {
        return runCatching {
            val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
            result.user ?: throw IllegalStateException("Firebase user was null after sign in")
        }
    }

    suspend fun sendPasswordReset(email: String): Result<Unit> {
        return runCatching {
            firebaseAuth.sendPasswordResetEmail(email).await()
        }
    }

    suspend fun sendEmailVerification(): Result<Unit> {
        return runCatching {
            val user = firebaseAuth.currentUser ?: throw IllegalStateException("No active user session")
            user.sendEmailVerification().await()
        }
    }

    suspend fun reloadUser(): Result<FirebaseUser> {
        return runCatching {
            val user = firebaseAuth.currentUser ?: throw IllegalStateException("No active user session")
            user.reload().await()
            user
        }
    }

    suspend fun getIdToken(forceRefresh: Boolean = false): Result<String> {
        return runCatching {
            val user = firebaseAuth.currentUser ?: throw IllegalStateException("No active user session")
            val tokenResult = user.getIdToken(forceRefresh).await()
            tokenResult.token ?: throw IllegalStateException("Token result was empty")
        }
    }

    fun logout() {
        firebaseAuth.signOut()
    }

    suspend fun deleteAccount(): Result<Unit> {
        return runCatching {
            val user = firebaseAuth.currentUser ?: throw IllegalStateException("No active user session")
            user.delete().await()
        }
    }
}

// -------------------------------------------------------------
// AuthViewModel
// -------------------------------------------------------------
class AuthViewModel(
    private val repository: AuthRepository = AuthRepository()
) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Unauthenticated)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkInitialAuthState()
    }

    private fun checkInitialAuthState() {
        val user = repository.currentUser
        if (user == null) {
            _authState.value = AuthState.Unauthenticated
        } else if (!user.isEmailVerified) {
            _authState.value = AuthState.EmailVerificationRequired(user)
        } else {
            _authState.value = AuthState.Authenticated(user)
        }
    }

    fun login(email: String, pass: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Authenticating
            repository.loginWithEmail(email, pass)
                .onSuccess { user ->
                    if (!user.isEmailVerified) {
                        _authState.value = AuthState.EmailVerificationRequired(user)
                    } else {
                        _authState.value = AuthState.Authenticated(user)
                    }
                }
                .onFailure { error ->
                    _authState.value = AuthState.Error(
                        message = error.localizedMessage ?: "Authentication failed",
                        code = "AUTH_LOGIN_FAILED"
                    )
                }
        }
    }

    fun register(email: String, pass: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Authenticating
            repository.registerWithEmail(email, pass)
                .onSuccess { user ->
                    _authState.value = AuthState.EmailVerificationRequired(user)
                }
                .onFailure { error ->
                    _authState.value = AuthState.Error(
                        message = error.localizedMessage ?: "Registration failed",
                        code = "AUTH_REGISTRATION_FAILED"
                    )
                }
        }
    }

    fun checkEmailVerificationStatus() {
        viewModelScope.launch {
            repository.reloadUser()
                .onSuccess { user ->
                    if (user.isEmailVerified) {
                        _authState.value = AuthState.Authenticated(user)
                    } else {
                        _authState.value = AuthState.EmailVerificationRequired(user)
                    }
                }
                .onFailure { error ->
                    _authState.value = AuthState.Error(error.localizedMessage ?: "Failed to refresh verification status")
                }
        }
    }

    fun logout() {
        repository.logout()
        _authState.value = AuthState.Unauthenticated
    }
}
