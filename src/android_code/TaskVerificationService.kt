package com.aegis.rewards.app.tasks

import com.aegis.rewards.app.auth.AuthRepository
import com.aegis.rewards.app.integrity.PlayIntegrityHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import java.util.UUID

/**
 * 30. ANTI-FRAUD & TASK VERIFICATION SERVICE (Android Client Implementation)
 *
 * CRITICAL SECURITY INVARIANT:
 * The client application is NEVER trusted as the source of truth.
 * All task sessions, verification tokens, timing checks, and ledger mutations
 * are server-authoritative.
 */

data class StartTaskRequest(
    val taskId: String,
    val deviceId: String
)

data class StartTaskResponse(
    val taskSessionId: String,
    val taskId: String,
    val userId: String,
    val startedAt: String,
    val expiresAt: String,
    val status: String,
    val verificationToken: String,
    val requiredDurationMs: Long,
    val rewardPoints: Int
)

data class VerifyTaskRequest(
    val taskSessionId: String,
    val verificationToken: String,
    val idempotencyKey: String,
    val deviceId: String,
    val clientTimeElapsedMs: Long,
    val appIntegrityToken: String? = null
)

data class VerifyTaskResponse(
    val success: Boolean,
    val message: String,
    val transaction: PointsTransactionDto?,
    val newBalance: Int
)

data class PointsTransactionDto(
    val id: String,
    val user_id: String,
    val task_session_id: String,
    val type: String,
    val amount: Int,
    val balance_before: Int,
    val balance_after: Int,
    val idempotency_key: String,
    val created_at: String
)

interface AegisRewardApi {
    @POST("api/tasks/session/start")
    suspend fun startSession(
        @Header("Authorization") bearerToken: String,
        @Body request: StartTaskRequest
    ): Response<StartTaskResponse>

    @POST("api/tasks/session/verify")
    suspend fun verifyCompletion(
        @Header("Authorization") bearerToken: String,
        @Body request: VerifyTaskRequest
    ): Response<VerifyTaskResponse>
}

class TaskVerificationService(
    private val api: AegisRewardApi,
    private val authRepository: AuthRepository,
    private val integrityHelper: PlayIntegrityHelper
) {

    /**
     * Executes the 11-step server-authoritative task lifecycle
     */
    suspend fun executeTaskFlow(
        taskId: String,
        deviceId: String,
        onProgress: (String) -> Unit
    ): Result<VerifyTaskResponse> = withContext(Dispatchers.IO) {
        runCatching {
            // Step 1: User requests task & fetch authenticated token
            onProgress("1. Validating Firebase Auth token...")
            val idToken = authRepository.getIdToken().getOrThrow()
            val bearer = "Bearer $idToken"

            // Step 2-4: Backend checks eligibility & issues short-lived session token
            onProgress("2. Requesting server-signed task session...")
            val startRes = api.startSession(bearer, StartTaskRequest(taskId, deviceId))
            if (!startRes.isSuccessful) {
                throw IllegalStateException("Failed to start session: ${startRes.errorBody()?.string()}")
            }
            val session = startRes.body() ?: throw IllegalStateException("Empty session response")

            onProgress("3. Session active: ${session.taskSessionId}. Minimum duration: ${session.requiredDurationMs / 1000}s")

            // Step 5: User completes legitimate task duration
            val startTime = System.currentTimeMillis()
            kotlinx.coroutines.delay(session.requiredDurationMs)
            val elapsed = System.currentTimeMillis() - startTime

            // Step 6: Acquire Play Integrity Attestation Token
            onProgress("4. Requesting Play Integrity token...")
            val integrityToken = integrityHelper.requestIntegrityToken(session.taskSessionId)

            // Step 7-11: Submit verification with unique Idempotency Key (Section 31)
            onProgress("5. Submitting verification to server anti-fraud gateway...")
            val idempotencyKey = "idem_${UUID.randomUUID()}"

            val verifyRes = api.verifyCompletion(
                bearer,
                VerifyTaskRequest(
                    taskSessionId = session.taskSessionId,
                    verificationToken = session.verificationToken,
                    idempotencyKey = idempotencyKey,
                    deviceId = deviceId,
                    clientTimeElapsedMs = elapsed,
                    appIntegrityToken = integrityToken
                )
            )

            if (!verifyRes.isSuccessful) {
                throw IllegalStateException("Anti-fraud validation failed: ${verifyRes.errorBody()?.string()}")
            }

            verifyRes.body() ?: throw IllegalStateException("Empty verification response")
        }
    }
}
