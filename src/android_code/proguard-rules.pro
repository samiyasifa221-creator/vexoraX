# -------------------------------------------------------------
# AegisRewards Hardened ProGuard / R8 Configuration
# -------------------------------------------------------------

# General Optimization
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
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Firebase Authentication & Firestore
-keepattributes *Annotation*
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Play Integrity API
-keep class com.google.android.play.core.integrity.** { *; }
-dontwarn com.google.android.play.core.integrity.**

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.**

# Retrofit & OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# Preserve Native Method Names (if JNI is used for root detection)
-keepclasseswithmembernames class * {
    native <methods>;
}
