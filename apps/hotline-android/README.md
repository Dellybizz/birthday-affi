# Hotline for Android

Android 8+ personal receiver with a native contact screen, incoming-call screen, Recents and Settings. The call screen includes elapsed time, microphone mute, speaker, local hold (silences both directions) and hang-up. A restricted hidden WebView handles the existing WebRTC audio transport; this is not a replacement for the system cellular Phone app.

## Personal build

No pairing form or pasted link is used. The private build includes a receiver-only credential. Keep this APK private: someone who obtains it could receive this Hotline's calls. Replacing the receiver configuration in Admin revokes it. No credential is committed to Git.

Allow microphone and notifications. Incoming monitoring starts after notification permission is granted. Use Battery settings to allow background reception and set battery use to Unrestricted and allow full-screen call alerts in Settings. Stop receiving remains available in Settings and the persistent notification.

Polling runs 300 ms after each response and reuses HTTP connections. Network delay, Android battery restrictions, force-stop and loss of internet can delay reception. Reliable screen-off latency and two-way audio require physical phone testing. The app preloads its call transport while open to reduce answer delay.

## Build

Use JDK 17, Android SDK platform 34 and build tools 34.0.0. Set `ANDROID_HOME`, and set `HOTLINE_RECEIVER_KEY_FILE` to a private file containing the 64-character receiver credential registered for this site. Run `bash build.sh`. Without a credential, the build cannot receive calls.

Use `HOTLINE_BUILD_DIR` for output and retain the signing certificate for updates. For release signing supply `HOTLINE_KEYSTORE`, `HOTLINE_STORE_PASS`, and `HOTLINE_KEY_ALIAS`. Do not commit credentials, signing keys, generated sources or APKs.

Build checks verify compilation, signature and manifest. Screen-off ringing, Answer/Decline, Bluetooth/earpiece/speaker routing and audio over different networks still need device verification.

Version 3 moves signaling to Mumbai, retains the native call screen over the lock screen after Answer, uses modern Android communication-device routing and adds hold. Reliable wake-up from Doze still requires high-priority FCM push registration and server delivery; polling is not a substitute. No push provider is configured in this repository.
