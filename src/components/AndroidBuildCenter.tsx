import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Download,
  Copy,
  Check,
  Cpu,
  Layers,
  FileCode,
  Shield,
  Key,
  FolderTree,
  ExternalLink,
  ChevronRight,
  Package,
} from 'lucide-react';

interface AndroidBuildCenterProps {
  token: string;
}

export const AndroidBuildCenter: React.FC<AndroidBuildCenterProps> = ({ token }) => {
  const [selectedFile, setSelectedFile] = useState<string>('app/build.gradle.kts');
  const [copied, setCopied] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [lastArtifact, setLastArtifact] = useState<any | null>(null);

  // Source code files representation
  const codeFiles: Record<string, { lang: string; description: string; content: string }> = {
    'app/build.gradle.kts': {
      lang: 'kotlin',
      description: 'App-level Gradle configuration with debug & release variants, R8, signing configs',
      content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.google.gms.services)
    alias(libs.plugins.firebase.crashlytics)
}

android {
    namespace = "com.aegis.rewards.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aegis.rewards.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 10200
        versionName = "1.2.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            // Securely loaded from environment variables or key.properties (never hardcoded!)
            val keystoreFile = System.getenv("AEGIS_KEYSTORE_PATH") ?: "keystore/release.keystore"
            storeFile = file(keystoreFile)
            storePassword = System.getenv("AEGIS_KEYSTORE_PASSWORD") ?: ""
            keyAlias = System.getenv("AEGIS_KEY_ALIAS") ?: "aegis_release_key"
            keyPassword = System.getenv("AEGIS_KEY_PASSWORD") ?: ""
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
            enableV4Signing = true
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-DEBUG"
            isDebuggable = true
            isMinifyEnabled = false
        }
        release {
            isDebuggable = false
            isMinifyEnabled = true
            isShrinkResources = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}`,
    },
    'proguard-rules.pro': {
      lang: 'pro',
      description: 'R8 / ProGuard rules for bytecode stripping, obfuscation & dead code elimination',
      content: `# General optimization & class repackaging
-repackageclasses 'com.aegis.rewards.internal'
-allowaccessmodification
-mergeinterfacesaggressively

# Strip all debug logging in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
    public static int w(...);
}

# Keep Data Models & DTOs for Moshi / JSON serialization
-keepclassmembers class * {
    @com.squareup.moshi.Json <fields>;
}
-keepattributes Signature, InnerClasses, EnclosingMethod

# Firebase Authentication & Firestore
-keepattributes *Annotation*
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Play Integrity API
-keep class com.google.android.play.core.integrity.** { *; }
-dontwarn com.google.android.play.core.integrity.**

# Kotlin Coroutines
-dontwarn kotlinx.coroutines.**`,
    },
    'AuthArchitecture.kt': {
      lang: 'kotlin',
      description: 'Centrally managed AuthState, AuthRepository, and AuthViewModel (Section 28)',
      content: `sealed class AuthState {
    object Unauthenticated : AuthState()
    object Authenticating : AuthState()
    data class Authenticated(val user: FirebaseUser) : AuthState()
    data class EmailVerificationRequired(val user: FirebaseUser) : AuthState()
    data class Error(val message: String, val code: String? = null) : AuthState()
}

class AuthRepository(private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()) {
    val currentUser: FirebaseUser? get() = firebaseAuth.currentUser

    suspend fun registerWithEmail(email: String, pass: String): Result<FirebaseUser> {
        val result = firebaseAuth.createUserWithEmailAndPassword(email, pass).await()
        val user = result.user ?: error("Null user")
        user.sendEmailVerification().await()
        return Result.success(user)
    }

    suspend fun loginWithEmail(email: String, pass: String): Result<FirebaseUser> {
        val result = firebaseAuth.signInWithEmailAndPassword(email, pass).await()
        return Result.success(result.user ?: error("Null user"))
    }
}

class AuthViewModel(private val repository: AuthRepository = AuthRepository()) : ViewModel() {
    private val _authState = MutableStateFlow<AuthState>(AuthState.Unauthenticated)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()
}`,
    },
    'TaskVerificationService.kt': {
      lang: 'kotlin',
      description: '11-Step Server-Authoritative Anti-Fraud Verification Service (Section 30)',
      content: `class TaskVerificationService(
    private val api: AegisRewardApi,
    private val authRepository: AuthRepository,
    private val integrityHelper: PlayIntegrityHelper
) {
    suspend fun executeTaskFlow(taskId: String, deviceId: String): Result<VerifyTaskResponse> {
        // Step 1: Validate Firebase Auth token
        val idToken = authRepository.getIdToken().getOrThrow()
        
        // Step 2-4: Request server-signed session token
        val session = api.startSession("Bearer $idToken", StartTaskRequest(taskId, deviceId)).body()!!
        
        // Step 5: User completes legitimate task duration
        val startTime = System.currentTimeMillis()
        kotlinx.coroutines.delay(session.requiredDurationMs)
        val elapsed = System.currentTimeMillis() - startTime
        
        // Step 6: Acquire Play Integrity token
        val integrityToken = integrityHelper.requestIntegrityToken(session.taskSessionId)
        
        // Step 7-11: Submit verification with Idempotency Key (Section 31)
        val idempotencyKey = "idem_\${UUID.randomUUID()}"
        return runCatching {
            api.verifyCompletion("Bearer $idToken", VerifyTaskRequest(
                taskSessionId = session.taskSessionId,
                verificationToken = session.verificationToken,
                idempotencyKey = idempotencyKey,
                deviceId = deviceId,
                clientTimeElapsedMs = elapsed,
                appIntegrityToken = integrityToken
            )).body()!!
        }
    }
}`,
    },
    'SIGNING_GUIDE.md': {
      lang: 'markdown',
      description: 'Keystore generation, environment variables, and ./gradlew instructions',
      content: `# Android Release & Signing Instructions

## 1. Keystore Creation (One-Time)
keytool -genkeypair -v -keystore release.keystore -alias aegis_release_key -keyalg RSA -keysize 2048 -validity 10000

## 2. Environment Variables
export AEGIS_KEYSTORE_PATH="/path/to/release.keystore"
export AEGIS_KEYSTORE_PASSWORD="SecureKeystorePassword2026!"
export AEGIS_KEY_ALIAS="aegis_release_key"
export AEGIS_KEY_PASSWORD="SecureKeyPassword2026!"

## 3. Exact Gradle Build Commands
# Debug APK
./gradlew assembleDebug

# Release APK (Signed, R8 Minified)
./gradlew assembleRelease

# Release AAB (Android App Bundle for Play Store)
./gradlew bundleRelease`,
    },
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeFiles[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runSimulatedGradle = async (command: string) => {
    setIsBuilding(true);
    setBuildLogs([`$ ./gradlew ${command}`, `Executing Gradle daemon 8.7.2 with JDK 17...`]);
    setLastArtifact(null);

    try {
      const res = await fetch('/api/build/simulate-gradle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ command }),
      });

      if (res.ok) {
        const data = await res.json();
        // Stream logs with slight delay for realistic visualization
        let currentLogs: string[] = [`$ ./gradlew ${command}`];
        for (let i = 0; i < data.logs.length; i++) {
          await new Promise((r) => setTimeout(r, 60));
          currentLogs = [...currentLogs, data.logs[i]];
          setBuildLogs([...currentLogs]);
        }
        setLastArtifact(data.artifact);
      }
    } catch (e: any) {
      setBuildLogs((prev) => [...prev, `ERROR: ${e.message}`]);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Android Build &amp; Release Center (Section 27)
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                SDK 35 • R8 Enabled
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Package: <code className="text-indigo-300 font-mono">com.aegis.rewards.app</code> | Version: 1.2.0 (Code: 10200)
            </p>
          </div>
        </div>

        {/* Quick Build Commands */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runSimulatedGradle('assembleDebug')}
            disabled={isBuilding}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs rounded-xl border border-slate-700 font-mono font-semibold flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3 h-3 text-slate-400" />
            ./gradlew assembleDebug
          </button>

          <button
            onClick={() => runSimulatedGradle('assembleRelease')}
            disabled={isBuilding}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs rounded-xl font-mono font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Play className="w-3 h-3 fill-current" />
            ./gradlew assembleRelease
          </button>

          <button
            onClick={() => runSimulatedGradle('bundleRelease')}
            disabled={isBuilding}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs rounded-xl font-mono font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Package className="w-3 h-3" />
            ./gradlew bundleRelease (AAB)
          </button>
        </div>
      </div>

      {/* Gradle Terminal & Artifact Inspector */}
      {buildLogs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Terminal Console */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Gradle Daemon Build Output
              </span>
              {isBuilding && <span className="text-[10px] text-amber-400 animate-pulse">Running compilation tasks...</span>}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 text-slate-300 pr-2">
              {buildLogs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('SUCCESSFUL')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('[R8]')
                      ? 'text-cyan-400'
                      : log.includes('ERROR')
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Generated Artifact Card */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Build Artifact Metadata
            </h3>

            {lastArtifact ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-200">{lastArtifact.name}</div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Format:</span>
                    <span className="font-semibold text-emerald-400">{lastArtifact.format}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Optimized Size:</span>
                    <span className="font-mono font-bold text-slate-200">{lastArtifact.sizeFormatted}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Target SDK:</span>
                    <span className="font-mono text-slate-200">Android 15 (API 35)</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[10px] font-mono text-slate-400 break-all space-y-1">
                  <div className="text-slate-500 uppercase">SHA-256 Checksum:</div>
                  <div className="text-indigo-300">{lastArtifact.checksumSha256}</div>
                </div>

                <button
                  onClick={() => alert(`Simulated download of ${lastArtifact.name} (${lastArtifact.sizeFormatted}) ready for deployment.`)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  Download {lastArtifact.name}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Run a Gradle command above to produce and inspect an APK or AAB artifact.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code Browser & ProGuard Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* File Tabs */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {Object.keys(codeFiles).map((filename) => (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  selectedFile === filename
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {filename}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* File Description */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>{codeFiles[selectedFile].description}</span>
          <span className="font-mono text-[11px] text-indigo-400 uppercase">{codeFiles[selectedFile].lang}</span>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed max-h-[460px]">
          <pre>{codeFiles[selectedFile].content}</pre>
        </div>
      </div>
    </div>
  );
};
