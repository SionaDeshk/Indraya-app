import { createClient } from "@supabase/supabase-js";
async function main() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL,
    key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw Error(
      "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env.local first. No credential values will be printed.",
    );
  if (key.startsWith("sb_secret_"))
    throw Error("Use a public publishable/anon key, never a secret key.");
  try {
    if (
      JSON.parse(
        atob((key.split(".")[1] ?? "").replace(/-/g, "+").replace(/_/g, "/")),
      ).role === "service_role"
    )
      throw Error("SERVICE_ROLE");
  } catch (error) {
    if (error instanceof Error && error.message === "SERVICE_ROLE")
      throw Error("Never use a service-role key in the mobile app.");
  }
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client
    .from("observation_feed")
    .select("id,event_type_id,domain_id,topic_id,answers,privacy_class,assessment_level,assessment_state,assessment_expires_at")
    .limit(1);
  if (error)
    throw Error(
      "Public report schema check failed. Apply all three SQL migrations and check API/RLS configuration.",
    );
  const spatial = await client.rpc("observations_in_bounds", {
    west: -151,
    south: 60,
    east: -148,
    north: 62,
  });
  if (spatial.error)
    throw Error(
      "Spatial query check failed. Apply the report-details migration.",
    );
  const { error: photoError } = await client.functions.invoke(
    "observation-photo",
    {
      body: { action: "url", mediaId: "00000000-0000-0000-0000-000000000000" },
    },
  );
  if (
    !photoError ||
    !("context" in photoError) ||
    !(photoError.context instanceof Response) ||
    photoError.context.status !== 404
  )
    throw Error(
      "Photo function check failed. Deploy observation-photo and inspect its server-side configuration.",
    );
  const body = await photoError.context.json();
  if (body.error !== "Photo unavailable")
    throw Error(
      "Photo endpoint did not return the expected private-access response.",
    );
  console.log(
    "PASS: public schema, bounded spatial RPC and deployed photo function. Email confirmation, sign-in, uploads, signed URLs, moderation and cross-device behavior still require an authenticated smoke test.",
  );
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Backend check failed.",
  );
  process.exitCode = 1;
});
