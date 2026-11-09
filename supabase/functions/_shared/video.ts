/** Bounded ISO-BMFF/QuickTime container sanitizer. No transcoding or content recognition. */
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 60;
export function sanitizeVideo(input: Uint8Array): {
  bytes: Uint8Array;
  duration: number;
  mime: "video/mp4" | "video/quicktime";
} {
  if (input.length < 32 || input.length > MAX_VIDEO_BYTES)
    throw Error("Choose a video under 20 MB.");
  const bytes = Uint8Array.from(input),
    view = new DataView(bytes.buffer);
  const text = (p: number) => String.fromCharCode(...bytes.subarray(p, p + 4));
  const containers = new Set([
    "moov",
    "trak",
    "mdia",
    "minf",
    "stbl",
    "edts",
    "dinf",
  ]);
  const leaves = new Set([
    "ftyp",
    "mdat",
    "mvhd",
    "tkhd",
    "mdhd",
    "hdlr",
    "vmhd",
    "smhd",
    "elst",
    "stts",
    "ctts",
    "stsc",
    "stsz",
    "stz2",
    "stco",
    "co64",
    "stss",
    "sdtp",
    "cslg",
    "avcC",
    "hvcC",
    "esds",
    "pasp",
    "colr",
    "clap",
    "btrt",
    "fiel",
    "gama",
  ]);
  let duration = 0,
    movie = 0,
    data = 0,
    videos = 0,
    brand = false,
    quicktime = false,
    boxes = 0;
  function free(start: number, end: number) {
    bytes.set([102, 114, 101, 101], start + 4);
    bytes.fill(0, start + 8, end); // Preserve all offsets, including stco/co64 and mdat positions.
  }
  function walk(start: number, end: number, depth: number, parent = "") {
    if (depth > 12) throw Error("Unsupported video structure.");
    for (let p = start; p < end;) {
      if (++boxes > 20000 || p + 8 > end)
        throw Error("Invalid video container.");
      const size = view.getUint32(p),
        kind = text(p + 4),
        stop = p + size;
      // Reject extended/zero-size boxes and fragmented/encrypted containers instead of guessing offsets.
      if (
        size < 8 ||
        stop > end ||
        ["moof", "mvex", "sinf", "encv", "enca"].includes(kind)
      )
        throw Error("Use a standard, unencrypted MP4 or MOV video.");
      if (kind === "ftyp") {
        if (depth !== 0 || size < 16 || brand)
          throw Error("Invalid video brand.");
        brand = true;
        quicktime = text(p + 8) === "qt  ";
        if (
          !["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "qt  "].includes(
            text(p + 8),
          )
        )
          throw Error("Use an MP4 or MOV video.");
      }
      if (kind === "moov") {
        if (depth !== 0) throw Error("Invalid movie.");
        movie++;
      }
      if (kind === "mdat") {
        if (depth !== 0) throw Error("Invalid video data.");
        data++;
      }
      if (["mvhd", "tkhd", "mdhd"].includes(kind)) {
        if (size < 32 || bytes[p + 8] > 1) throw Error("Invalid video timing.");
        const version = bytes[p + 8],
          clockBytes = version === 1 ? 16 : 8;
        if (size < (version === 1 ? 44 : 32))
          throw Error("Invalid video timing.");
        bytes.fill(0, p + 12, p + 12 + clockBytes); // Creation/modification timestamps.
        if (kind === "mvhd") {
          const offset = p + (version === 1 ? 28 : 20),
            scale = view.getUint32(offset);
          const ticks =
            version === 1
              ? Number(view.getBigUint64(offset + 4))
              : view.getUint32(offset + 4);
          duration = ticks / scale;
          if (
            !scale ||
            !Number.isFinite(duration) ||
            duration <= 0 ||
            duration > MAX_VIDEO_SECONDS
          )
            throw Error("Choose a video up to 60 seconds long.");
        }
      }
      if (kind === "hdlr") {
        const allowed = parent === "mdia" ? ["vide", "soun"] : ["url ", "alis"];
        if (size < 32 || !allowed.includes(text(p + 16)))
          throw Error("Export the clip with only video and audio tracks.");
        bytes.fill(0, p + 32, stop); // Human-readable track names.
      }
      if (kind === "dref") {
        if (
          size < 16 ||
          view.getUint32(p + 12) !== 1 ||
          size !== 28 ||
          text(p + 20) !== "url " ||
          view.getUint32(p + 24) !== 1
        )
          throw Error("External video references are unsupported.");
      } else if (kind === "stsd") {
        if (size < 16 || view.getUint32(p + 12) !== 1)
          throw Error("Unsupported video encoding.");
        const entry = p + 16,
          entrySize = view.getUint32(entry),
          codec = text(entry + 4);
        if (entrySize < 36 || entry + entrySize !== stop)
          throw Error("Invalid video sample entry.");
        if (["avc1", "hvc1", "hev1"].includes(codec)) {
          if (entrySize < 86) throw Error("Invalid video dimensions.");
          const width = view.getUint16(entry + 32),
            height = view.getUint16(entry + 34);
          if (!width || !height || Math.max(width, height) > 1920)
            throw Error("Export a video at 1080p or smaller.");
          bytes.fill(0, entry + 20, entry + 24);
          bytes.fill(0, entry + 50, entry + 82);
          videos++;
          walk(entry + 86, stop, depth + 1);
        } else if (codec === "mp4a") {
          const version = view.getUint16(entry + 16),
            header = version === 0 ? 36 : version === 1 ? 52 : 0;
          if (!header || entrySize < header)
            throw Error("Unsupported audio encoding.");
          bytes.fill(0, entry + 20, entry + 24);
          walk(entry + header, stop, depth + 1);
        } else throw Error("Use H.264/HEVC video with AAC audio.");
      } else if (containers.has(kind)) walk(p + 8, stop, depth + 1, kind);
      else if (!leaves.has(kind)) free(p, stop); // Includes udta, meta, uuid, location and vendor metadata.
      p = stop;
    }
  }
  walk(0, bytes.length, 0);
  if (!brand || movie !== 1 || !data || !videos || !duration)
    throw Error("Incomplete video.");
  return { bytes, duration, mime: quicktime ? "video/quicktime" : "video/mp4" };
}
