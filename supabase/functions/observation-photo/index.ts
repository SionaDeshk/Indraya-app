import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { decodeBase64, sanitizeJpeg } from "../_shared/media.ts";
import { MAX_VIDEO_BYTES, sanitizeVideo } from "../_shared/video.ts";
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
    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const token = request.headers
      .get("Authorization")
      ?.replace(/^Bearer\s+/i, "");
    const user = token ? (await service.auth.getUser(token)).data.user : null;
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: "Request body required" }, 400);
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.length;
      if (size > (user ? 29000000 : 16384)) {
        await reader.cancel();
        return reply({ error: "Attachment request too large" }, 413);
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
      let contentType = "image/jpeg",
        duration: number | null = null;
      try {
        if (
          body.mediaKind !== undefined &&
          !["photo", "video"].includes(body.mediaKind)
        )
          return reply({ error: "Unsupported attachment type" }, 400);
        if (body.mediaKind === "video") {
          if (body.base64.length > Math.ceil(MAX_VIDEO_BYTES / 3) * 4)
            throw Error("Video too large");
          const raw = atob(body.base64);
          const clip = sanitizeVideo(
            Uint8Array.from(raw, (c) => c.charCodeAt(0)),
          );
          image = clip.bytes;
          contentType = clip.mime;
          duration = clip.duration;
        } else image = sanitizeJpeg(decodeBase64(body.base64));
      } catch {
        return reply(
          {
            error:
              "Use a JPEG under 2 MB, or a standard MP4/MOV up to 60 seconds and 20 MB.",
          },
          400,
        );
      }
      const extension =
        contentType === "image/jpeg"
          ? "jpg"
          : contentType === "video/mp4"
            ? "mp4"
            : "mov";
      const path = `${report.id}/${crypto.randomUUID()}.${extension}`;
      const upload = await service.storage
        .from("observation-media")
        .upload(path, image, { contentType, upsert: false });
      if (upload.error)
        return reply(
          {
            error:
              "Unable to save attachment. The observation is already saved.",
          },
          503,
        );
      const insert = await service
        .from("observation_media")
        .insert({
          observation_id: report.id,
          storage_path: path,
          status: "pending",
          media_kind: body.mediaKind === "video" ? "video" : "photo",
          content_type: contentType,
          duration_seconds: duration,
        })
        .select("id")
        .single();
      if (insert.error) {
        await service.storage.from("observation-media").remove([path]);
        return reply(
          {
            error:
              "Unable to attach media. Try again; the observation is already saved.",
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
        .select("id,observation_id,storage_path,status,media_kind")
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
        kind: media.media_kind ?? "photo",
        canRemove: !!user && user.id === report?.author_id,
      });
    }
    return reply({ error: "Unknown action" }, 400);
  } catch {
    return reply({ error: "Unable to process photo request" }, 400);
  }
});
