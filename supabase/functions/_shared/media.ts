/** Strip JPEG APP1–APP15 (EXIF/XMP/IPTC), comments, and trailing data. Preserve image scans. */
export function sanitizeJpeg(input: Uint8Array): Uint8Array {
  if (
    input.length < 4 ||
    input.length > 2 * 1024 * 1024 ||
    input[0] !== 255 ||
    input[1] !== 216
  )
    throw Error("Choose a JPEG image under 2 MB after resizing.");
  const parts: Uint8Array[] = [input.slice(0, 2)];
  let i = 2,
    sawImage = false,
    sawScan = false,
    ended = false;
  while (i < input.length) {
    const start = i;
    if (input[i++] !== 255) throw Error("Invalid JPEG structure.");
    while (input[i] === 255) i++;
    const marker = input[i++];
    if (marker === 217) {
      parts.push(new Uint8Array([255, 217]));
      ended = true;
      break;
    }
    if (marker === 216 || marker === 0 || (marker >= 208 && marker <= 215))
      throw Error("Invalid JPEG marker.");
    if (i + 2 > input.length) throw Error("Truncated JPEG.");
    const length = (input[i] << 8) | input[i + 1];
    const end = i + length;
    if (length < 2 || end > input.length)
      throw Error("Truncated JPEG segment.");
    if (marker === 192 || marker === 194) {
      if (length < 8) throw Error("Invalid JPEG dimensions.");
      const h = (input[i + 3] << 8) | input[i + 4],
        w = (input[i + 5] << 8) | input[i + 6];
      if (!w || !h || w > 2048 || h > 2048)
        throw Error("Photo dimensions exceed the allowed size.");
      sawImage = true;
    }
    if (!(marker >= 225 && marker <= 239) && marker !== 254)
      parts.push(input.slice(start, end));
    i = end;
    if (marker === 218) {
      sawScan = true;
      const scanStart = i;
      while (i < input.length) {
        if (input[i] !== 255) {
          i++;
          continue;
        }
        let j = i + 1;
        while (input[j] === 255) j++;
        if (input[j] === 0 || (input[j] >= 208 && input[j] <= 215)) {
          i = j + 1;
          continue;
        }
        break;
      }
      parts.push(input.slice(scanStart, i));
    }
  }
  if (!ended || !sawImage || !sawScan) throw Error("Incomplete JPEG image.");
  const size = parts.reduce((n, p) => n + p.length, 0),
    output = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    output.set(p, offset);
    offset += p.length;
  }
  return output;
}
export function decodeBase64(value: string): Uint8Array {
  if (value.length > 2800000) throw Error("Photo is too large.");
  const raw = atob(value);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
export function encodeBase64(bytes: Uint8Array): string {
  let value = "";
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
