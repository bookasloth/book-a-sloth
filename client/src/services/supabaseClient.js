// Lazy Supabase client. @supabase/supabase-js is ~206 KB raw (~54 KB gzip); a
// static `createClient` at module load pulled it into the first-paint bundle on
// EVERY page — including the logged-out public homepage, which needs no auth to
// render (the AuthContext loading gate runs off localStorage + app token, not
// supabase). Dynamic-import it on first use so it stays off the critical path.
//
// Callers: `const sb = await getSupabase()` then use `sb.auth.*`. The three uses
// (onAuthStateChange listener, signOut, 401 refreshSession) all already run async
// or off first paint, so the extra await costs nothing user-visible.
let clientPromise = null;

export function getSupabase() {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      ),
    );
  }
  return clientPromise;
}
