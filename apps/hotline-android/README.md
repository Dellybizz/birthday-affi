# Hotline Receiver for Android

Android 8+ receiver using the existing private Hotline API and WebRTC receiver.
This is a development APK, not a tested production phone client. No pairing key
or microphone data is embedded in the APK. Pair with Admin → Hotline → receiver
link. The caller link cannot pair as a receiver.

## Use

1. Install the APK and allow microphone and notification permissions.
2. Paste the private **receiver** link, then tap **Pair & enable receiver**.
3. In Battery settings, give Hotline Receiver unrestricted battery use. On
   Android 14+, allow full-screen incoming-call notifications in display settings.
4. Leave the ongoing receiver notification enabled. Answer or Decline incoming
   calls from the notification or lock-screen call panel. Stop receiving is always
   available from settings and the ongoing notification.
5. After reboot, reopen the app and enable receiver. Force-stopping it prevents
   reception until it is reopened. Do not share your private receiver link.

The foreground service checks authenticated call state every 600ms **after each
request completes**. Network/backend delay adds to detection time. A wake lock
keeps monitoring active while explicitly enabled; it uses battery and mobile data.
Alerts obey notification/DND settings. This is polling, not Firebase push:
Doze restrictions, vendor battery policies, lost internet, force-stop, permission
revocation and backend downtime can delay/prevent alerts. No instant-delivery SLA
or physical-phone latency result is claimed. Production reception should use
high-priority FCM call pushes and phone testing before relying on this as the only
way to receive calls.

Answer opens the trusted HTTPS receiver in Android System WebView and answers
only the matching call ID. Keep Android System WebView current. Network reachability
and the backend's STUN/TURN configuration still determine audio connection.
The call screen stays awake during use; closing it ends the browser call.

## Build

Install JDK 17, Android SDK `platforms;android-34`, `build-tools;34.0.0`.
Run `ANDROID_HOME=/path/to/sdk ./build.sh`. Output defaults to
`/tmp/hotline-android-build/Hotline-Receiver.apk`. No Maven dependencies required.
Use `HOTLINE_BUILD_DIR` for another output directory. For release signing supply
`HOTLINE_KEYSTORE`, `HOTLINE_STORE_PASS`, `HOTLINE_KEY_ALIAS`. Never commit signing
keys, receiver tokens, or built APKs. The local default development certificate
must be retained if subsequent development APKs should update this installation.

Build verification checks compilation, APK signature and Android manifest.
Incoming-call delivery, permissions, microphone routing and audio must also be
verified on the recipient's actual phone, including screen-off and Wi-Fi/mobile
network combinations.
