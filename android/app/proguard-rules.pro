# -------------------------------------------------------------
# VexoraX Capacitor & R8 ProGuard Configuration
# -------------------------------------------------------------

# Keep JavaScript Interfaces for Capacitor web bridge
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor Core and Plugins
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-dontwarn com.getcapacitor.**

# Firebase Authentication, Cloud Messaging, and Firestore
-keepattributes *Annotation*
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Google Play Services & Play Integrity API
-keep class com.google.android.gms.** { *; }
-keep class com.google.android.play.core.integrity.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.android.play.core.integrity.**

# Preserve generic signatures & annotations for JSON parsing
-keepattributes Signature, InnerClasses, EnclosingMethod, SourceFile, LineNumberTable

# Keep Enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}
