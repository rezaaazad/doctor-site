/** Decode one URI layer, preserving malformed percent escapes for literal lookup. */
export function decodeRouteSlug(slug: string): string {
  try {
    slug = decodeURIComponent(slug);
  } catch {
    // A literal percent sign need not introduce a valid UTF-8 escape.
  }
  return slug.normalize("NFC");
}
