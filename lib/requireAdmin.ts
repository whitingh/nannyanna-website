import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(
  request: Request
) {
  const authHeader =
    request.headers.get("authorization");

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return {
      ok: false as const,
      status: 401,
      error: "Not signed in.",
    };
  }

  const accessToken =
    authHeader.slice(7);

  // Client acting as the signed-in user.
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(
    accessToken
  );

  if (userError || !user) {
    return {
      ok: false as const,
      status: 401,
      error: "Invalid session.",
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    profile?.role !== "admin"
  ) {
    console.error(
      "Admin profile check failed:",
      profileError,
      profile
    );

    return {
      ok: false as const,
      status: 403,
      error: "Admin access required.",
    };
  }

  // Only create the privileged client
  // after the user has been verified.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return {
    ok: true as const,
    user,
    supabaseAdmin,
  };
}