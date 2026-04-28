import { describe, expect, it } from "vitest";
import type { BrinScanResult } from "./brin";
import { formatInspectionOutput } from "./service";
import type { PaymentInspectionResult } from "./types";

const minimalInspection = (overrides: Partial<PaymentInspectionResult> = {}): PaymentInspectionResult => ({
  requiresPayment: false,
  url: "https://api.example.com/data",
  method: "GET",
  status: 200,
  options: [],
  ...overrides,
});

describe("formatInspectionOutput — no payment required", () => {
  it("returns the data string verbatim when present", () => {
    const out = formatInspectionOutput(minimalInspection({ data: "hello world" }));
    expect(out).toBe("hello world");
  });

  it("JSON-stringifies non-string data", () => {
    const out = formatInspectionOutput(minimalInspection({ data: { ok: true, n: 42 } }));
    expect(out).toBe('{"ok":true,"n":42}');
  });

  it("emits empty object string when data is missing", () => {
    const out = formatInspectionOutput(minimalInspection({ data: undefined }));
    expect(out).toBe("{}");
  });
});

describe("formatInspectionOutput — payment required", () => {
  it("renders each payment option with index, network, asset, payTo", () => {
    const out = formatInspectionOutput(
      minimalInspection({
        requiresPayment: true,
        status: 402,
        description: "Premium API access",
        options: [
          {
            scheme: "exact",
            network: "base",
            asset: "USDC",
            amount: "0.10",
            payTo: "0xfeed",
          },
          {
            scheme: "exact",
            network: "base-sepolia",
            asset: "USDC",
            maxAmountRequired: "0.25",
          },
        ],
      }),
    );
    expect(out).toContain("Payment required (402).");
    expect(out).toContain("Description: Premium API access");
    expect(out).toContain("1. 0.10 via base (USDC) -> 0xfeed");
    expect(out).toContain("2. 0.25 via base-sepolia (USDC)");
  });

  it("falls back through amount → maxAmountRequired → price → 0", () => {
    const out = formatInspectionOutput(
      minimalInspection({
        requiresPayment: true,
        status: 402,
        options: [
          { scheme: "exact", network: "base", asset: "USDC", price: "1.00" },
          { scheme: "exact", network: "base", asset: "USDC" },
        ],
      }),
    );
    expect(out).toContain("1. 1.00 via base (USDC)");
    expect(out).toContain("2. 0 via base (USDC)");
  });
});

describe("formatInspectionOutput — Brin security info", () => {
  const brin: BrinScanResult = {
    score: 78,
    verdict: "safe",
    confidence: "high",
    url: "https://brin.sh/domain/api.example.com",
    subScores: { identity: 90, behavior: 80, content: null, graph: 65 },
    threats: [{ type: "phishing", severity: "low", detail: "weak DNS history" }],
  };

  it("appends Brin lines after a non-payment response", () => {
    const out = formatInspectionOutput(minimalInspection({ data: "ok", brin }));
    const lines = out.split("\n");
    expect(lines[0]).toBe("ok");
    expect(out).toContain("Security: 78/100 (safe, high confidence)");
    expect(out).toContain("Identity: 90 | Behavior: 80 | Graph: 65");
    expect(out).toContain("[low] phishing: weak DNS history");
    // null subScore should not produce a line item
    expect(out).not.toContain("Content: ");
  });

  it("appends Brin lines after a payment-required response", () => {
    const out = formatInspectionOutput(
      minimalInspection({
        requiresPayment: true,
        status: 402,
        options: [{ scheme: "exact", network: "base", asset: "USDC", amount: "0.05" }],
        brin,
      }),
    );
    expect(out).toContain("Payment required (402).");
    expect(out).toContain("Security: 78/100 (safe, high confidence)");
  });

  it("omits Brin block when not provided", () => {
    const out = formatInspectionOutput(minimalInspection({ data: "ok" }));
    expect(out).toBe("ok");
    expect(out).not.toContain("Security:");
  });
});
