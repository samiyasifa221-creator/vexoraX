# AegisRewards: Android Build, Signing & Release Guide

## 1. Keystore Creation (One-Time Setup)

Generate a secure 2048-bit RSA release keystore using Java `keytool`:

```bash
keytool -genkeypair -v \
  -keystore release.keystore \
  -alias aegis_release_key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype PKCS12
```

> **CRITICAL SECURITY RULE**: Never check `.keystore` or `key.properties` into Git!
> Ensure `*.keystore` and `key.properties` are listed in `.gitignore`.

---

## 2. Environment Variables & CI/CD Secret Configuration

Set the following variables in your CI/CD runner (GitHub Actions / Cloud Build) or your local shell:

```bash
export AEGIS_KEYSTORE_PATH="/path/to/secure/release.keystore"
export AEGIS_KEYSTORE_PASSWORD="YourStrongKeystorePassword2026!"
export AEGIS_KEY_ALIAS="aegis_release_key"
export AEGIS_KEY_PASSWORD="YourStrongKeyPassword2026!"
```

Or configure `key.properties` locally (git-ignored):
```properties
storeFile=/path/to/secure/release.keystore
storePassword=YourStrongKeystorePassword2026!
keyAlias=aegis_release_key
keyPassword=YourStrongKeyPassword2026!
```

---

## 3. Exact Gradle Build Commands

### A. Debug APK (For local development & emulators)
```bash
./gradlew assembleDebug
```
* Output location: `app/build/outputs/apk/debug/app-debug.apk`
* Features: Debuggable, logging enabled, minification disabled, package suffix `.debug`

### B. Release APK (For direct sideload testing & internal distribution)
```bash
./gradlew assembleRelease
```
* Output location: `app/build/outputs/apk/release/app-release.apk`
* Features: Signed with release keystore, R8 minification & obfuscation enabled, dead code stripped, resources shrunk, debug logs removed.

### C. Release AAB (Android App Bundle for Google Play Store Production)
```bash
./gradlew bundleRelease
```
* Output location: `app/build/outputs/bundle/release/app-release.aab`
* Features: Optimized modular dynamic delivery format required for Google Play Console submission.

---

## 4. Verification with `apksigner` and `bundletool`

Verify v1-v4 signatures:
```bash
apksigner verify --verbose app/build/outputs/apk/release/app-release.apk
```

Validate AAB package structure:
```bash
bundletool validate --bundle=app/build/outputs/bundle/release/app-release.aab
```
