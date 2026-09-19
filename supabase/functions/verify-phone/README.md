# `verify-phone`

This Edge Function is the trusted phone-verification boundary.

## Server-only secrets

Configure these Supabase Edge Function secrets. None belong in `VITE_*` variables, React code, localStorage, or source control:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHONE_HASH_SECRET`

`PHONE_HASH_SECRET` should be a high-entropy randomly generated value. The function derives `phone_hash` as HMAC-SHA-256 over `phone:<normalized E.164 phone>`. It derives the stored device identifier separately as HMAC-SHA-256 over `device:<client-provided opaque identifier>`, so unnecessary hardware information is never stored.

## Requests

Request an OTP:

```json
{
  "action": "request",
  "phone": "+254700000000"
}
```

Verify an OTP and create/update the pseudonymous identity:

```json
{
  "action": "verify",
  "phone": "+254700000000",
  "token": "123456",
  "deviceIdentifier": "browser-generated-opaque-id",
  "deviceType": "web"
}
```

The response contains the Supabase Auth session and non-sensitive resident identity fields. It never returns the phone number or phone hash.
