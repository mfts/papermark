import { describe, expect, it } from "vitest";

import {
  collectFingerprintHeaders,
  generateSessionFingerprint,
} from "../dataroom-auth";

function makeHeaders(overrides: Record<string, string> = {}) {
  const map: Record<string, string> = {
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": '"Chromium";v="124", "Google Chrome";v="124"',
    "sec-ch-ua-platform": '"macOS"',
    "sec-ch-ua-mobile": "?0",
    ...overrides,
  };
  return { get: (name: string) => map[name] ?? null };
}

// -------------------------------------------------------------------
// Core fingerprint generation
// -------------------------------------------------------------------
describe("generateSessionFingerprint", () => {
  it("produces a deterministic SHA-256 hex string", () => {
    const headers = collectFingerprintHeaders(makeHeaders());
    const a = generateSessionFingerprint(headers);
    const b = generateSessionFingerprint(headers);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when User-Agent differs", () => {
    const base = collectFingerprintHeaders(makeHeaders());
    const alt = collectFingerprintHeaders(
      makeHeaders({ "user-agent": "DifferentBrowser/1.0" }),
    );
    expect(generateSessionFingerprint(base)).not.toBe(
      generateSessionFingerprint(alt),
    );
  });

  it("changes when Accept-Language differs", () => {
    const base = collectFingerprintHeaders(makeHeaders());
    const alt = collectFingerprintHeaders(
      makeHeaders({ "accept-language": "fr-FR,fr;q=0.9" }),
    );
    expect(generateSessionFingerprint(base)).not.toBe(
      generateSessionFingerprint(alt),
    );
  });

  it("changes when Sec-CH-UA differs", () => {
    const base = collectFingerprintHeaders(makeHeaders());
    const alt = collectFingerprintHeaders(
      makeHeaders({ "sec-ch-ua": '"Firefox";v="125"' }),
    );
    expect(generateSessionFingerprint(base)).not.toBe(
      generateSessionFingerprint(alt),
    );
  });

  it("changes when Sec-CH-UA-Platform differs", () => {
    const base = collectFingerprintHeaders(makeHeaders());
    const alt = collectFingerprintHeaders(
      makeHeaders({ "sec-ch-ua-platform": '"Windows"' }),
    );
    expect(generateSessionFingerprint(base)).not.toBe(
      generateSessionFingerprint(alt),
    );
  });

  it("is stable when IP address changes (IP not in fingerprint)", () => {
    const a = collectFingerprintHeaders(makeHeaders());
    const b = collectFingerprintHeaders(makeHeaders());
    expect(generateSessionFingerprint(a)).toBe(generateSessionFingerprint(b));
  });
});

// -------------------------------------------------------------------
// Missing Sec-CH-* headers (Safari / Firefox)
// -------------------------------------------------------------------
describe("missing Sec-CH-UA headers", () => {
  it("produces a valid fingerprint when all client hints are absent", () => {
    const safariHeaders: Record<string, string> = {
      "user-agent": "Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Safari/17.4",
      "accept-language": "en-US",
    };
    const safari = { get: (name: string) => safariHeaders[name] ?? null };
    const headers = collectFingerprintHeaders(safari);
    expect(headers.secChUa).toBeUndefined();
    expect(headers.secChUaPlatform).toBeUndefined();
    expect(headers.secChUaMobile).toBeUndefined();

    const fp = generateSessionFingerprint(headers);
    expect(fp).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is consistent between creation and verification when hints are absent", () => {
    const raw: Record<string, string> = {
      "user-agent": "Mozilla/5.0 Firefox/126.0",
      "accept-language": "de-DE",
    };
    const h = { get: (name: string) => raw[name] ?? null };
    const fp1 = generateSessionFingerprint(collectFingerprintHeaders(h));
    const fp2 = generateSessionFingerprint(collectFingerprintHeaders(h));
    expect(fp1).toBe(fp2);
  });

  it("differs from a Chrome fingerprint with client hints present", () => {
    const firefoxRaw: Record<string, string> = {
      "user-agent": "Mozilla/5.0 Firefox/126.0",
      "accept-language": "en-US",
    };
    const chromeRaw: Record<string, string> = {
      "user-agent": "Mozilla/5.0 Firefox/126.0",
      "accept-language": "en-US",
      "sec-ch-ua": '"Chromium";v="124"',
      "sec-ch-ua-platform": '"Linux"',
      "sec-ch-ua-mobile": "?0",
    };
    const firefox = { get: (name: string) => firefoxRaw[name] ?? null };
    const chrome = { get: (name: string) => chromeRaw[name] ?? null };
    expect(
      generateSessionFingerprint(collectFingerprintHeaders(firefox)),
    ).not.toBe(
      generateSessionFingerprint(collectFingerprintHeaders(chrome)),
    );
  });
});

// -------------------------------------------------------------------
// Cross-router consistency (NextRequest-style vs NextApiRequest-style)
// -------------------------------------------------------------------
describe("collectFingerprintHeaders cross-router consistency", () => {
  it("produces identical output for NextRequest-style and NextApiRequest-style adapters", () => {
    const rawHeaders: Record<string, string> = {
      "user-agent": "TestBrowser/1.0",
      "accept-language": "en-US",
      "sec-ch-ua": '"TestBrand";v="1"',
      "sec-ch-ua-platform": '"TestOS"',
      "sec-ch-ua-mobile": "?0",
    };

    // NextRequest-style: headers.get(name)
    const nextRequestStyle = {
      get: (name: string) => rawHeaders[name] ?? null,
    };

    // NextApiRequest-style: req.headers[name] may be string | string[]
    const pagesHeaders: Record<string, string | string[]> = { ...rawHeaders };
    const pagesAdapterGet = (name: string) => {
      const v = pagesHeaders[name];
      return (Array.isArray(v) ? v[0] : v) ?? null;
    };

    const fpNext = generateSessionFingerprint(
      collectFingerprintHeaders(nextRequestStyle),
    );
    const fpPages = generateSessionFingerprint(
      collectFingerprintHeaders({ get: pagesAdapterGet }),
    );

    expect(fpNext).toBe(fpPages);
  });

  it("handles array-valued headers from Pages router correctly", () => {
    const pagesHeaders: Record<string, string | string[]> = {
      "user-agent": ["TestBrowser/1.0", "fallback"],
      "accept-language": ["en-US", "en"],
      "sec-ch-ua": ['"Brand";v="1"'],
      "sec-ch-ua-platform": ['"OS"'],
      "sec-ch-ua-mobile": ["?0"],
    };
    const get = (name: string) => {
      const v = pagesHeaders[name];
      return (Array.isArray(v) ? v[0] : v) ?? null;
    };

    const singleHeaders = {
      get: (name: string) =>
        ({
          "user-agent": "TestBrowser/1.0",
          "accept-language": "en-US",
          "sec-ch-ua": '"Brand";v="1"',
          "sec-ch-ua-platform": '"OS"',
          "sec-ch-ua-mobile": "?0",
        })[name] ?? null,
    };

    expect(
      generateSessionFingerprint(collectFingerprintHeaders({ get })),
    ).toBe(
      generateSessionFingerprint(
        collectFingerprintHeaders(singleHeaders),
      ),
    );
  });
});

// -------------------------------------------------------------------
// Legacy session fallback (no fingerprint field)
// -------------------------------------------------------------------
describe("legacy session fallback", () => {
  it("DataroomSessionSchema accepts sessions without a fingerprint field", async () => {
    const { DataroomSessionSchema } = await import("../dataroom-auth");
    const legacy = {
      linkId: "link_1",
      dataroomId: "dr_1",
      viewId: "view_1",
      expiresAt: Date.now() + 60_000,
      ipAddress: "1.2.3.4",
      verified: true,
    };
    const parsed = DataroomSessionSchema.parse(legacy);
    expect(parsed.fingerprint).toBeUndefined();
  });

  it("DataroomSessionSchema accepts sessions with a fingerprint field", async () => {
    const { DataroomSessionSchema } = await import("../dataroom-auth");
    const fp = generateSessionFingerprint(
      collectFingerprintHeaders(makeHeaders()),
    );
    const session = {
      linkId: "link_1",
      dataroomId: "dr_1",
      viewId: "view_1",
      expiresAt: Date.now() + 60_000,
      ipAddress: "1.2.3.4",
      fingerprint: fp,
      verified: true,
    };
    const parsed = DataroomSessionSchema.parse(session);
    expect(parsed.fingerprint).toBe(fp);
  });

  it("LinkSessionSchema accepts sessions without a fingerprint field", async () => {
    const { LinkSessionSchema } = await import("../link-session");
    const legacy = {
      linkId: "link_1",
      viewId: "view_1",
      email: "test@example.com",
      expiresAt: Date.now() + 60_000,
      ipAddress: "1.2.3.4",
      userAgent: "TestBrowser/1.0",
      verified: true,
      linkType: "DOCUMENT_LINK" as const,
      accessCount: 1,
      maxAccesses: 1000,
      lastAccessedAt: Date.now(),
      createdAt: Date.now(),
    };
    const parsed = LinkSessionSchema.parse(legacy);
    expect(parsed.fingerprint).toBeUndefined();
  });

  it("LinkSessionSchema accepts sessions with a fingerprint field", async () => {
    const { LinkSessionSchema } = await import("../link-session");
    const fp = generateSessionFingerprint(
      collectFingerprintHeaders(makeHeaders()),
    );
    const session = {
      linkId: "link_1",
      viewId: "view_1",
      email: "test@example.com",
      expiresAt: Date.now() + 60_000,
      ipAddress: "1.2.3.4",
      userAgent: "TestBrowser/1.0",
      fingerprint: fp,
      verified: true,
      linkType: "DATAROOM_LINK" as const,
      accessCount: 1,
      maxAccesses: 1000,
      lastAccessedAt: Date.now(),
      createdAt: Date.now(),
    };
    const parsed = LinkSessionSchema.parse(session);
    expect(parsed.fingerprint).toBe(fp);
  });
});
