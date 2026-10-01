# Private live Hotline

Her capability link opens `/app/hotline#key=…`; his opens `/hotline/receive#key=…`.
The 256-bit key assigns the role without an account. Browser fragments are removed
and keys retained only in sessionStorage for that tab. Database stores SHA-256
hashes only. Treat each URL as an access credential. Replacing links in Admin →
Settings → Private Hotline links revokes both and ends the active call.

The existing `incoming-call` section renders the live screen and the same disabled
preview in the visual editor. Its incomingTitle, callerName, answerLabel remain
editable through the existing hierarchy. Recorded messages stay playable separately.

Calls use WebRTC audio (no video or recording). SDP includes completed ICE candidates,
exchanged through token-authorized PostgreSQL RPCs. A single pair row is locked for
updates to serialize call starts. Ringing expires after 60 seconds; connected calls
expire after 90 seconds without heartbeats. Poll interval: 2 seconds, no overlapping
requests. Invalid/stale IDs cannot answer or hang up a newer call. No direct table
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

This commit implements browser calling and receiver-link pairing credentials.
An Android APK, Firebase device registration/push delivery, foreground call service,
and lock-screen notifications are NOT shipped here. Browser receiver must remain
open; Enable incoming ringtone unlocks browser audio. Receiving a push alone does
not create an audio call; Android must accept, acquire its microphone and negotiate
WebRTC. Do not advertise background ringing until native device tests pass.

## Checks

`tests/sql/live-hotline.sql` is a rollback-only live database test of roles,
invalid token rejection, call offer/answer/end, stale IDs and table access denial.
Security advisors flag the intentional capability-authorized SECURITY DEFINER RPC
and denied-by-default private table; those are deliberate for login-free links.
Final two-device voice quality and TURN traversal require actual microphones and
configured relay service; builds and signaling tests do not certify these.
