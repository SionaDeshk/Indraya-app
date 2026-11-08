import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { decodeBase64, sanitizeJpeg } from "../_shared/media.ts";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response(null, { headers: cors });
  if (request.method !== "POST") return reply({ error: "POST required" }, 405);
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Request body required" }, 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > 2900000) {
        await reader.cancel();
        return reply({ error: "Photo request too large" }, 413);
      }
      chunks.push(chunk.value);
    }
    const raw = new Uint8Array(size);
    let cursor = 0;
    for (const chunk of chunks) {
      raw.set(chunk, cursor);
      cursor += chunk.length;
    }
    const body = JSON.parse(new TextDecoder().decode(raw));
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const token = request.headers
      .get("Authorization")
      ?.replace(/^Bearer\s+/i, "");
    const user = token ? (await service.auth.getUser(token)).data.user : null;
    const uuid = (v: unknown): v is string =>
      typeof v === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    if (body.action === "upload") {
      if (!user) return reply({ error: "Sign in to attach a photo" }, 401);
      if (!uuid(body.observationId) || typeof body.base64 !== "string")
        return reply({ error: "Invalid upload" }, 400);
      const { data: report } = await service
        .from("observations")
        .select("id,author_id,status")
        .eq("id", body.observationId)
        .maybeSingle();
      if (
        !report ||
        report.author_id !== user.id ||
        !["published", "review"].includes(report.status)
      )
        return reply(
          { error: "You cannot attach a photo to this report" },
          403,
        );
      const { data: existing } = await service
        .from("observation_media")
        .select("id")
        .eq("observation_id", report.id)
        .maybeSingle();
      if (existing) return reply({ ok: true, mediaId: existing.id });
      let image: Uint8Array;
      try {
        image = sanitizeJpeg(decodeBase64(body.base64));
      } catch {
        return reply({ error: "Use a resized JPEG under 2 MB" }, 400);
      }
      const path = `${report.id}/${crypto.randomUUID()}.jpg`;
      const upload = await service.storage
        .from("observation-media")
        .upload(path, image, { contentType: "image/jpeg", upsert: false });
      if (upload.error)
        return reply(
          { error: "Unable to save photo. The report is already saved." },
          503,
        );
      const insert = await service
        .from("observation_media")
        .insert({
          observation_id: report.id,
          storage_path: path,
          status: "pending",
        })
        .select("id")
        .single();
      if (insert.error) {
        await service.storage.from("observation-media").remove([path]);
        return reply(
          {
            error:
              "Unable to attach photo. Try again; the report is already saved.",
          },
          409,
        );
      }
      return reply({ ok: true, mediaId: insert.data.id });
    }
    if (body.action === "remove") {
      if (!user || !uuid(body.mediaId))
        return reply({ error: "Sign in to remove your photo" }, 401);
      const { data: media } = await service
        .from("observation_media")
        .select("id,observation_id,storage_path")
        .eq("id", body.mediaId)
        .maybeSingle();
      if (!media) return reply({ ok: true });
      const { data: report } = await service
        .from("observations")
        .select("author_id")
        .eq("id", media.observation_id)
        .maybeSingle();
      if (report?.author_id !== user.id)
        return reply({ error: "You cannot remove this photo" }, 403);
      const removed = await service.storage
        .from("observation-media")
        .remove([media.storage_path]);
      if (removed.error) return reply({ error: "Unable to remove photo" }, 503);
      const deleted = await service
        .from("observation_media")
        .delete()
        .eq("id", media.id);
      if (deleted.error)
        return reply({ error: "Unable to remove photo record" }, 503);
      return reply({ ok: true });
    }
    if (body.action === "url") {
      if (!uuid(body.mediaId)) return reply({ error: "Invalid photo" }, 400);
      const { data: media } = await service
        .from("observation_media")
        .select("id,observation_id,storage_path,status")
        .eq("id", body.mediaId)
        .maybeSingle();
      if (!media) return reply({ error: "Photo unavailable" }, 404);
      const { data: report } = await service
        .from("observations")
        .select("author_id,status")
        .eq("id", media.observation_id)
        .maybeSingle();
      const { data: moderator } = user
        ? await service
            .from("moderators")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle()
        : { data: null };
      const canRead =
        report &&
        ((media.status === "approved" && report.status === "published") ||
          user?.id === report.author_id ||
          !!moderator);
      if (!canRead) return reply({ error: "Photo unavailable" }, 404);
      const { data, error } = await service.storage
        .from("observation-media")
        .createSignedUrl(media.storage_path, 60);
      if (error || !data)
        return reply({ error: "Photo temporarily unavailable" }, 503);
      return reply({
        url: data.signedUrl,
        status: media.status,
        canRemove: !!user && user.id === report?.author_id,
      });
    }
    return reply({ error: "Unknown action" }, 400);
  } catch {
    return reply({ error: "Unable to process photo request" }, 400);
  }
});
