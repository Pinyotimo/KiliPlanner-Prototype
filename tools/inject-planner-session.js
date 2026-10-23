// A stand-in planner session, for looking at the console without an
// account. It is injected before the app boots, so the shell believes it is
// signed in as an admin, while the API calls go out the way an anonymous
// visitor's would - the fake token is dropped from the request headers.
//
// This is a screenshot aid, not a way into the product: the session grants
// no access the API does not already give the public.

try {
  localStorage.setItem(
    "sb-nungepdpugumhtatbawy-auth-token",
    JSON.stringify({
      access_token: "stand-in",
      refresh_token: "stand-in",
      expires_at: Math.floor(Date.now() / 1000) + 86400,
      expires_in: 86400,
      token_type: "bearer",
      user: {
        id: "00000000-0000-0000-0000-000000000001",
        aud: "authenticated",
        role: "authenticated",
        email: "planner@kiliplanner.test",
        app_metadata: { role: "admin" },
        user_metadata: {},
        created_at: new Date().toISOString(),
      },
    }),
  );
} catch (error) {
  /* the origin may not allow storage; the screenshot will show the sign-in */
}

const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (init && init.headers) {
    const headers = new Headers(init.headers);
    headers.delete("Authorization");
    init = Object.assign({}, init, { headers });
  }
  return originalFetch.call(window, input, init);
};
