# `submit-report`

This function is the only trusted report-creation boundary. The browser must invoke it with the resident's Supabase Auth access token; it must not insert directly into `issues`.

Pipeline enforced by the function:

```text
authenticated verified resident
  -> quota
  -> server geofence and GPS validation
  -> evidence validation and private Storage upload
  -> abuse/risk checks
  -> issues insert with status UNVERIFIED
  -> audit event
```

The function never accepts a client-provided status. `UNVERIFIED` is assigned server-side. Risk scores, quota attempts, audit events, and evidence metadata are private tables. Evidence files are stored in the private `report-evidence` bucket.

Category policy is read from `report_categories`; clients must not be treated as the source of truth for category requirements. Administrators can change the policy flags without changing the report submission code.

For categories with `requires_live_photo = true`, the public form uses `getUserMedia` for `Open Camera -> Capture -> Preview -> Retake/Confirm`. The function requires `evidenceCaptureMode: "camera"`, a recent capture timestamp, and a valid image payload. Client metadata is only a defense-in-depth signal; proving camera provenance cryptographically would require a platform attestation service.

Report quotas use independent action buckets: `HIGH_IMPACT_REPORT` is seeded at one per verified resident per 24 hours, while `NORMAL_REPORT` is seeded at five per 24 hours. Endorsements and comments use separate `ENDORSEMENT` and `COMMENT` buckets in `trust_action_events`, so report limits do not suppress unrelated civic participation. Those action endpoints should record their own events before accepting the action.

Device and network inputs are HMAC-derived risk signals, not permanent identity. Repeated shared signals, rapid timing, repeated location targeting, and suspicious location data produce `COORDINATION_RISK` or other review flags. Normal activity is not challenged; CAPTCHA is requested only when risk is high, and repeated failed/high-risk actions can be handled by a separate suspension workflow.

The first velocity anomaly rules are server-side: three non-rejected reports in the same action bucket within 10 minutes creates `VELOCITY_SPIKE`, and a report from an identity created within the last hour creates `NEW_ACCOUNT_VELOCITY`. These signals increase behavior risk and may trigger CAPTCHA, but do not automatically accuse or suspend the resident.

Location anomaly rules are also server-side: movement above 55 m/s between samples creates `IMPOSSIBLE_TRAVEL`; a report within 10 metres of the resident's recent report location creates `REPEATED_REPORT_LOCATION`; a GPS accuracy change of at least 75 metres creates `GPS_ACCURACY_SHIFT`; and a report beyond 75% of the configured radius creates `REPORT_LOCATION_FAR`. These signals are recorded, increase risk, and may trigger review/CAPTCHA. The configured radius remains the only hard location rejection boundary.

Content anomaly rules inspect the recent report window server-side: exact normalized matches or token similarity of at least 80% create `CONTENT_DUPLICATE`; repeated keywords occurring three or more times create `REPEATED_KEYWORDS`; similar text across categories creates `CROSS_CATEGORY_COPY`; more than two links creates `EXCESSIVE_LINKS`; and repeated-character/spam-like phrases create `SUSPICIOUS_TEXT`. These signals increase risk and may trigger CAPTCHA/review, but do not automatically reject a report because legitimate residents may describe the same civic problem similarly.

Coordination rules create `SHARED_DEVICE_SIGNAL` for the same HMAC device signal across residents, `SHARED_NETWORK_SIGNAL` for repeated network overlap across residents, `LOCATION_TARGETING_CLUSTER` for multiple recent accounts targeting the same area, and `IDENTICAL_CROSS_ACCOUNT_WORDING` for reused wording across accounts/categories. The endorsement function creates `ENDORSEMENT_BURST` after five endorsements for one report within 30 seconds. These are coordination-risk flags only; they increase review/CAPTCHA risk and do not automatically label residents malicious.

Risk is calculated as five bounded components:

```text
risk_score = average(
  velocity_score,
  location_score,
  content_score,
  evidence_score,
  coordination_score
)
```

Action bands are: `0-39 NORMAL`, `40-69 MONITOR`, `70-84 CAPTCHA_MANUAL_REVIEW`, and `85-100 TEMPORARY_SUSPENSION_RECOMMENDED`. The last band creates a recommendation for authorized review; it does not automatically suspend the resident.

Each evidence item stores its report, private storage path, capture time and coordinates, location accuracy, MIME type, byte size, and a server-generated SHA-256 hash. Before storage, the function searches previous hashes. A match creates a `DUPLICATE_EVIDENCE` audit event and raises review risk, but does not automatically reject the report.

Evidence anomaly rules also create `CROSS_RESIDENT_EVIDENCE` when a matching hash belongs to another resident, `EVIDENCE_TIMESTAMP_MISMATCH` when capture time is missing or more than 15 minutes from server receipt, and `EVIDENCE_LOCATION_FAR` when capture coordinates exceed the category radius from the report point. These signals raise risk and manual-review priority but do not automatically reject legitimate repeated evidence.

For geofenced categories, the function calculates haversine distance between the resident GPS point and report point using the category's `allowed_radius_meters` (seeded to 50 metres). It stores both points, distance, accuracy, radius, and `location_verification` (`verified`, `uncertain`, or `failed`). Missing/abnormal accuracy, stale or inconsistent timestamps, and outside-radius results become risk signals and audit metadata; suspicious signals increase review risk rather than serving as definitive proof of spoofing.
