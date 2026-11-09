import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import {
  decodeBase64,
  sanitizeJpeg,
} from "../supabase/functions/_shared/media";
import {
  sanitizeVideo,
  MAX_VIDEO_BYTES,
} from "../supabase/functions/_shared/video";
const source = readFileSync(
  new URL("../supabase/functions/observation-photo/index.ts", import.meta.url),
  "utf8",
).replace(/^import[\s\S]*?;\n/gm, "");
const script = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;
const id = "11111111-1111-1111-1111-111111111111";
const mediaId = "22222222-2222-2222-2222-222222222222";
function harness({
  user,
  owner = "owner",
  status = "published",
  mediaStatus,
  staff = false,
  failInsert = false,
}: {
  user?: string;
  owner?: string;
  status?: string;
  mediaStatus?: string;
  staff?: boolean;
  failInsert?: boolean;
} = {}) {
  const writes: { action: string; value?: unknown }[] = [];
  let handler: (r: Request) => Promise<Response>;
  const client = {
    auth: {
      getUser: async () => ({ data: { user: user ? { id: user } : null } }),
    },
    from(table: string) {
      const q = {
        select: () => q,
        eq: () => q,
        insert: (value: unknown) => {
          writes.push({ action: "insert", value });
          return q;
        },
        delete: () => {
          writes.push({ action: "delete" });
          return q;
        },
        single: async () => ({
          data: { id: mediaId },
          error: failInsert ? {} : null,
        }),
        maybeSingle: async () => ({
          data:
            table === "observations"
              ? { id, author_id: owner, status }
              : table === "moderators"
                ? staff
                  ? { user_id: user }
                  : null
                : mediaStatus
                  ? {
                      id: mediaId,
                      observation_id: id,
                      status: mediaStatus,
                      media_kind: "video",
                      storage_path: "synthetic.mp4",
                    }
                  : null,
        }),
        then: (resolve: (r: unknown) => void) =>
          Promise.resolve({ error: null }).then(resolve),
      };
      return q;
    },
    storage: {
      from: () => ({
        upload: async (_path: string, bytes: Uint8Array, options: unknown) => {
          writes.push({ action: "upload", value: { bytes, options } });
          return { error: null };
        },
        remove: async () => {
          writes.push({ action: "remove" });
          return { error: null };
        },
        createSignedUrl: async (_path: string, ttl: number) => {
          writes.push({ action: "sign", value: ttl });
          return {
            data: { signedUrl: "https://example.invalid/synthetic" },
            error: null,
          };
        },
      }),
    },
  };
  new Function(
    "createClient",
    "decodeBase64",
    "sanitizeJpeg",
    "MAX_VIDEO_BYTES",
    "sanitizeVideo",
    "Deno",
    script,
  )(() => client, decodeBase64, sanitizeJpeg, MAX_VIDEO_BYTES, sanitizeVideo, {
    env: { get: () => "synthetic-local-test" },
    serve: (h: typeof handler) => {
      handler = h;
    },
  });
  return {
    writes,
    call: (body: unknown) =>
      handler(
        new Request("http://localhost/media", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user ? { Authorization: "Bearer synthetic" } : {}),
          },
          body: JSON.stringify(body),
        }),
      ),
  };
}
test("video uploads validate real user and owner, sanitize bytes, and remain pending on held observations", async () => {
  const fixture = readFileSync(
    new URL("./fixtures/video-with-metadata.mp4", import.meta.url),
  );
  const body = {
    action: "upload",
    observationId: id,
    mediaKind: "video",
    base64: fixture.toString("base64"),
  };
  for (const config of [
    {},
    { user: "other" },
    { user: "owner", status: "hidden" },
  ]) {
    const h = harness(config),
      r = await h.call(body);
    assert.equal(r.status, config.user ? 403 : 413);
    assert.equal(h.writes.length, 0);
  }
  const h = harness({ user: "owner", status: "review" });
  assert.equal((await h.call(body)).status, 200);
  const record = h.writes.find((w) => w.action === "insert")!.value as Record<
    string,
    unknown
  >;
  assert.equal(record.media_kind, "video");
  assert.equal(record.content_type, "video/mp4");
  assert.equal(record.status, "pending");
  assert(Number(record.duration_seconds) <= 60);
  const uploaded = h.writes.find((w) => w.action === "upload")!.value as {
    bytes: Uint8Array;
  };
  assert(
    !Buffer.from(uploaded.bytes).includes(Buffer.from("PRIVATE TEST VIDEO")),
  );
  const failed = harness({ user: "owner", failInsert: true });
  assert.equal((await failed.call(body)).status, 409);
  assert(failed.writes.some((w) => w.action === "remove"));
});
test("private video reads/removal enforce owner/staff/publication checks and short signed expiry", async () => {
  for (const [config, allowed] of [
    [{ mediaStatus: "pending" }, false],
    [{ user: "other", mediaStatus: "pending" }, false],
    [{ mediaStatus: "approved" }, true],
    [{ mediaStatus: "approved", status: "hidden" }, false],
    [{ user: "owner", mediaStatus: "pending" }, true],
    [{ user: "staff", staff: true, mediaStatus: "pending" }, true],
  ] as const) {
    const h = harness(config);
    assert.equal(
      (await h.call({ action: "url", mediaId })).status,
      allowed ? 200 : 404,
    );
    if (allowed) assert.equal(h.writes[0].value, 60);
    else assert.equal(h.writes.length, 0);
  }
  const other = harness({ user: "other", mediaStatus: "pending" });
  assert.equal((await other.call({ action: "remove", mediaId })).status, 403);
  assert.equal(other.writes.length, 0);
});
test("JPEG upload remains compatible and unsupported/corrupt video is rejected", async () => {
  const h = harness({ user: "owner" });
  const jpeg = readFileSync(
    new URL("./fixtures/photo-with-metadata.jpg", import.meta.url),
  );
  assert.equal(
    (
      await h.call({
        action: "upload",
        observationId: id,
        base64: jpeg.toString("base64"),
      })
    ).status,
    200,
  );
  const row = h.writes.find((w) => w.action === "insert")!.value as Record<
    string,
    unknown
  >;
  assert.equal(row.media_kind, "photo");
  assert.equal(row.content_type, "image/jpeg");
  assert.equal(row.duration_seconds, null);
  const bad = harness({ user: "owner" });
  assert.equal(
    (
      await bad.call({
        action: "upload",
        observationId: id,
        mediaKind: "video",
        base64: "aGVsbG8=",
      })
    ).status,
    400,
  );
  assert.equal(bad.writes.length, 0);
});
test("anonymous requests have a small body budget and never reach Storage", async () => {
  const h = harness();
  assert.equal((await h.call({ action: "upload" })).status, 401);
  assert.equal(
    (await h.call({ action: "upload", base64: "x".repeat(20000) })).status,
    413,
  );
  assert.equal(h.writes.length, 0);
});
