export const TEST_SENTINEL = "FRASERPAYV2-TEST";

export const RUN_ID: string = `${Date.now().toString(36)}-${Math.random()
  .toString(36)
  .slice(2, 8)}`;

function slug(label: string): string {
  const cleaned = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "x";
}

export function testTag(label: string): string {
  return `${TEST_SENTINEL}-${RUN_ID}-${slug(label)}`;
}

export function testEmail(label: string, domain = "pdsb.net"): string {
  const local = `${TEST_SENTINEL}-${RUN_ID}-${slug(label)}`.toLowerCase();
  return `${local}@${domain}`;
}

export function testStudentNumber(label = ""): string {
  let hash = 0;
  for (const ch of `${RUN_ID}-${label}`) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return `9999${hash.toString().padStart(8, "0").slice(0, 8)}`;
}

export function isTestRecord(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.toUpperCase().includes(TEST_SENTINEL);
}
