package expo.modules.privacyscreen

import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException

class WriteSettingsNotGrantedException :
  CodedException("WRITE_SETTINGS_NOT_GRANTED", "WRITE_SETTINGS permission not granted. Open System Settings to allow this app to modify system settings.", null)

class PrivacyScreenModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PrivacyScreen")

    AsyncFunction("isSupported") {
      val manufacturer = Build.MANUFACTURER?.lowercase() ?: ""
      if (!manufacturer.contains("samsung")) {
        return@AsyncFunction false
      }
      // Check if device has privacy screen hardware support
      try {
        val context = appContext.reactContext ?: return@AsyncFunction false
        val supported = Settings.System.getInt(
          context.contentResolver,
          "privacy_screen_supported",
          0
        )
        return@AsyncFunction supported == 1
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("isEnabled") {
      try {
        val context = appContext.reactContext ?: return@AsyncFunction false
        val enabled = Settings.System.getInt(
          context.contentResolver,
          "privacy_screen_enable",
          0
        )
        return@AsyncFunction enabled == 1
      } catch (e: Exception) {
        return@AsyncFunction false
      }
    }

    AsyncFunction("setEnabled") { enabled: Boolean ->
      val context = appContext.reactContext
        ?: throw CodedException("NO_CONTEXT", "Application context not available", null)

      if (!Settings.System.canWrite(context)) {
        throw WriteSettingsNotGrantedException()
      }

      Settings.System.putInt(
        context.contentResolver,
        "privacy_screen_enable",
        if (enabled) 1 else 0
      )
    }
  }
}
