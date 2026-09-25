plugins {
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
        vectorDrawables {
            useSupportLibrary = true
        }

        // Security: Expose server API endpoint via BuildConfig
        buildConfigField("String", "API_BASE_URL", "\"https://api.aegisrewards.io/v1/\"")
    }

    signingConfigs {
        create("release") {
            // NEVER hardcode keystore passwords or keys in source code!
            // Loaded securely from environment variables or local key.properties
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
            manifestPlaceholders["networkSecurityConfig"] = "@xml/network_security_config_debug"
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
            manifestPlaceholders["networkSecurityConfig"] = "@xml/network_security_config"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX & Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)

    // Firebase (BOM)
    implementation(platform("com.google.firebase:firebase-bom:33.4.0"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-appcheck-playintegrity")
    implementation("com.google.firebase:firebase-crashlytics-ktx")

    // Google Play Integrity API
    implementation("com.google.android.play:integrity:1.4.0")

    // Coroutines & Networking
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}
