# Private live Hotline

The normal `/app/hotline` page prepares a temporary caller capability automatically; no caller link or login is required. His private receiver link opens `/hotline/receive#key=…`.
The 256-bit key assigns the role without an account. Receiver fragments are removed and receiver keys retained only in sessionStorage for that tab. Caller tokens live only in component memory, expire in 12 hours, and are tied to the receiver-link generation. Other public visitors see a busy line and cannot inspect or hang up an active call. Database stores SHA-256
hashes only. Treat each URL as an access credential. Replacing links in Admin →
Settings → Private Hotline links revokes both and ends the active call.

The existing `incoming-call` section renders the live screen and the same disabled
preview in the visual editor. Its incomingTitle, callerName, answerLabel remain
editable through the existing hierarchy. Recorded messages stay playable separately.

Calls use WebRTC audio (no video or recording). SDP is exchanged immediately; trickle ICE candidates follow through token-authorized PostgreSQL RPCs. Ringing no longer waits for full ICE gathering. A single pair row is locked for
updates to serialize call starts. Ringing expires after 60 seconds; connected calls
expire after 90 seconds without heartbeats. Adaptive polling: 1 second while waiting, 400ms while ringing/connecting, 5 seconds once audio is connected; no overlapping requests. Invalid/stale IDs cannot answer or hang up a newer call. No direct table
access is granted to visitor or signed-in roles.

## Network setup

Optional server-only web environment settings:
- HOTLINE_TURN_URL
- HOTLINE_TURN_USERNAME
- HOTLINE_TURN_CREDENTIAL

Without TURN, only STUN/direct connections are available. Some mobile networks and
firewalls will fail. Configure a private TURN relay before declaring calls reliable.
Use short-lived TURN credentials for a larger deployment; current private two-user
configuration returns configured credentials only after verifying a capability.

## Receiver APK boundary

The private native Android receiver is in `apps/hotline-android`. It includes incoming call notifications and an explicit foreground polling service. Its hidden WebView supplies WebRTC transport; the native screen supplies call controls. Answer opens over the lock screen. Local hold silences microphone and received audio while keeping signaling alive. Browser speaker switching works only when the browser exposes output-device selection; other browsers use the device's current audio route.

Signaling is hosted in Mumbai next to the database. Polling and HTTP connection reuse reduce avoidable delay, but cannot guarantee immediate delivery in Android Doze. High-priority FCM push delivery is required for that and is not configured. APK updates require the private receiver credential and original signing key; do not generate an unconfigured APK or revoke the existing receiver merely to test a build.

## Checks

`tests/sql/live-hotline.sql` is a rollback-only live database test of roles,
invalid token rejection, call offer/answer/end, stale IDs and table access denial.
Security advisors flag the intentional capability-authorized SECURITY DEFINER RPC
and denied-by-default private table; those are deliberate for login-free links.
Final two-device voice quality and TURN traversal require actual microphones and
configured relay service; builds and signaling tests do not certify these.
