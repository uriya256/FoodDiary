plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.uriya.fooddiary"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.uriya.fooddiary"
        minSdk = 26
        targetSdk = 35
        versionCode = 5
        versionName = "1.4"
        ndk {
            // phones only: keeps the APK smaller (the OCR engine ships native code per CPU type)
            abiFilters += listOf("arm64-v8a", "armeabi-v7a")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            // signed with the debug key so the release APK installs directly
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    androidResources {
        noCompress += "traineddata"
    }
    lint {
        abortOnError = false
        checkReleaseBuilds = false
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.exifinterface:exifinterface:1.3.7")
    implementation("cz.adaptech.tesseract4android:tesseract4android:4.9.0")
}
