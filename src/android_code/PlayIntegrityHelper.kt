package com.aegis.rewards.app.integrity

import android.content.Context
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest
import kotlinx.coroutines.tasks.await
import java.security.MessageDigest
import java.util.Base64

/**
 * 34. APP INTEGRITY (Google Play Integrity API Helper)
 *
 * Requests on-device attestation tokens bound to server session nonces.
 * Server verifies token with Google Play Integrity servers.
 */
class PlayIntegrityHelper(private val context: Context) {

    private val integrityManager = IntegrityManagerFactory.create(context)
    // Cloud Project Number linked with Google Play Console
    private val cloudProjectNumber: Long = 522416188058L

    suspend fun requestIntegrityToken(sessionNonce: String): String? {
        return try {
            // Hash the server session ID to construct a secure 32-byte nonce
            val digest = MessageDigest.getInstance("SHA-256")
            val hashedNonce = digest.digest(sessionNonce.toByteArray(Charsets.UTF_8))
            val base64Nonce = Base64.getUrlEncoder().withoutPadding().encodeToString(hashedNonce)

            val integrityTokenResponse = integrityManager.requestIntegrityToken(
                IntegrityTokenRequest.builder()
                    .setCloudProjectNumber(cloudProjectNumber)
                    .setNonce(base64Nonce)
                    .build()
            ).await()

            integrityTokenResponse.token()
        } catch (e: Exception) {
            // Log local error without exposing sensitive internals
            android.util.Log.e("AegisIntegrity", "Failed to retrieve Play Integrity token: ${e.message}")
            null
        }
    }
}
