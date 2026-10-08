#!/usr/bin/env bash
set -euo pipefail
# Requires JDK 17 and Android SDK Platform/Build Tools 34.0.0.
# Set ANDROID_HOME, HOTLINE_KEYSTORE, HOTLINE_STORE_PASS and HOTLINE_KEY_ALIAS for release signing.
project_dir="$(cd "$(dirname "$0")" && pwd)"
sdk_dir="${ANDROID_HOME:?Set ANDROID_HOME to your Android SDK}"
build_dir="${HOTLINE_BUILD_DIR:-/tmp/hotline-android-build}"
tools_dir="$sdk_dir/build-tools/34.0.0"
platform_jar="$sdk_dir/platforms/android-34/android.jar"
mkdir -p "$build_dir/classes" "$build_dir/gen" "$build_dir/dex"
"$tools_dir/aapt2" compile --dir "$project_dir/res" -o "$build_dir/resources.zip"
"$tools_dir/aapt2" link -I "$platform_jar" --manifest "$project_dir/AndroidManifest.xml" -o "$build_dir/base.apk" "$build_dir/resources.zip" --java "$build_dir/gen"
mapfile -t java_sources < <(find "$project_dir/src" "$build_dir/gen" -name '*.java')
javac -source 8 -target 8 -classpath "$platform_jar" -d "$build_dir/classes" "${java_sources[@]}"
jar cf "$build_dir/classes.jar" -C "$build_dir/classes" .
"$tools_dir/d8" --lib "$platform_jar" --min-api 26 --output "$build_dir/dex" "$build_dir/classes.jar"
(cd "$build_dir/dex" && zip -q -j "$build_dir/base.apk" classes.dex)
"$tools_dir/zipalign" -f 4 "$build_dir/base.apk" "$build_dir/aligned.apk"
# Development build uses a local debug certificate. Private pairing key is never bundled.
keystore="${HOTLINE_KEYSTORE:-$build_dir/debug.keystore}"
if [[ ! -f "$keystore" ]]; then
 if [[ -n "${HOTLINE_KEYSTORE:-}" ]]; then echo "Release keystore missing" >&2; exit 1; fi
 keytool -genkeypair -keystore "$keystore" -storepass android -keypass android -alias androiddebugkey -dname 'CN=Hotline Development' -keyalg RSA -keysize 2048 -validity 10000 >/dev/null 2>&1
fi
export HOTLINE_STORE_PASS="${HOTLINE_STORE_PASS:-android}"
"$tools_dir/apksigner" sign --ks "$keystore" --ks-key-alias "${HOTLINE_KEY_ALIAS:-androiddebugkey}" --ks-pass env:HOTLINE_STORE_PASS --out "$build_dir/Hotline-Receiver.apk" "$build_dir/aligned.apk"
"$tools_dir/apksigner" verify --verbose "$build_dir/Hotline-Receiver.apk"
"$tools_dir/aapt2" dump badging "$build_dir/Hotline-Receiver.apk"
echo "APK: $build_dir/Hotline-Receiver.apk"
