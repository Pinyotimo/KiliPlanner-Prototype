import type { Session } from "@supabase/supabase-js";

export const AUTH_STATES = {
  ANONYMOUS: "ANONYMOUS",
  OTP_PENDING: "OTP_PENDING",
  VERIFIED_RESIDENT: "VERIFIED_RESIDENT",
  SUSPENDED: "SUSPENDED",
  ADMIN: "ADMIN",
  OFFICIAL: "OFFICIAL",
  CONTRACTOR: "CONTRACTOR",
} as const;

export type AuthState = (typeof AUTH_STATES)[keyof typeof AUTH_STATES];
export type AuthenticationStatus = "UNAUTHENTICATED" | "AUTHENTICATED";
export type PublicIdentity = "anonymous" | "staff";

export interface AuthStateContext {
  session: Session | null;
  otpPending?: boolean;
  verificationStatus?: "pending" | "verified" | "suspended" | "revoked";
  suspendedUntil?: string | null;
  role?: "admin" | "official" | "contractor" | "resident";
}

export interface ResolvedAuthState {
  state: AuthState;
  authenticationStatus: AuthenticationStatus;
  publicIdentity: PublicIdentity;
}

function isSuspended(context: AuthStateContext): boolean {
  if (context.verificationStatus === "suspended") return true;
  if (!context.suspendedUntil) return false;
  return new Date(context.suspendedUntil).getTime() > Date.now();
}

/**
 * Resolve internal authorization state separately from public identity.
 * A verified resident is authenticated internally but remains anonymous publicly.
 */
export function resolveAuthState(context: AuthStateContext): ResolvedAuthState {
  if (isSuspended(context)) {
    return {
      state: AUTH_STATES.SUSPENDED,
      authenticationStatus: context.session ? "AUTHENTICATED" : "UNAUTHENTICATED",
      publicIdentity: "anonymous",
    };
  }

  if (context.role === "admin") {
    return { state: AUTH_STATES.ADMIN, authenticationStatus: "AUTHENTICATED", publicIdentity: "staff" };
  }
  if (context.role === "official") {
    return { state: AUTH_STATES.OFFICIAL, authenticationStatus: "AUTHENTICATED", publicIdentity: "staff" };
  }
  if (context.role === "contractor") {
    return { state: AUTH_STATES.CONTRACTOR, authenticationStatus: "AUTHENTICATED", publicIdentity: "staff" };
  }
  if (context.verificationStatus === "verified") {
    return {
      state: AUTH_STATES.VERIFIED_RESIDENT,
      authenticationStatus: "AUTHENTICATED",
      publicIdentity: "anonymous",
    };
  }
  if (context.otpPending) {
    return {
      state: AUTH_STATES.OTP_PENDING,
      authenticationStatus: "UNAUTHENTICATED",
      publicIdentity: "anonymous",
    };
  }

  return {
    state: AUTH_STATES.ANONYMOUS,
    authenticationStatus: "UNAUTHENTICATED",
    publicIdentity: "anonymous",
  };
}

export function getRoleFromSession(session: Session | null): AuthStateContext["role"] {
  // app_metadata is server-controlled; user_metadata must never authorize access.
  const role = session?.user.app_metadata?.role;
  return role === "admin" || role === "official" || role === "contractor" || role === "resident"
    ? role
    : undefined;
}