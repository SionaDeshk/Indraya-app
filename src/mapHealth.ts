/** Only known base-tile transport failures qualify; style/auth and unrelated errors retain native logging. */
export function isTileTransportFailure(message: string) {
  return (
    /(?:tile\.opentopomap\.org|opentopomap|Failed to load tile)/i.test(
      message,
    ) &&
    /(?:NSURLErrorDomain|network|timed? ?out|connection|HTTP.*(?:429|50\d)|-1005)/i.test(
      message,
    )
  );
}
