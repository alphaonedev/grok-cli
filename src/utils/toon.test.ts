import { describe, expect, it } from "vitest";
import { compress, formatObject, jsonToToon } from "./toon";

describe("jsonToToon", () => {
  it("handles null", () => {
    expect(jsonToToon(null)).toBe("null");
  });

  it("handles booleans", () => {
    expect(jsonToToon(true)).toBe("true");
    expect(jsonToToon(false)).toBe("false");
  });

  it("handles numbers", () => {
    expect(jsonToToon(42)).toBe("42");
    expect(jsonToToon(3.14)).toBe("3.14");
  });

  it("handles strings", () => {
    expect(jsonToToon("hello")).toBe("hello");
    expect(jsonToToon("has,comma")).toBe('"has,comma"');
    expect(jsonToToon("has:colon")).toBe('"has:colon"');
  });

  it("handles empty array", () => {
    expect(jsonToToon([])).toBe("[0]:");
  });

  it("handles primitive array", () => {
    expect(jsonToToon(["a", "b", "c"])).toBe("[3]: a,b,c");
  });

  it("renders tabular array of objects", () => {
    const data = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    const result = jsonToToon(data);
    expect(result).toContain("[2]{id,name}:");
    expect(result).toContain("1,Alice");
    expect(result).toContain("2,Bob");
  });

  it("handles nested object", () => {
    const result = jsonToToon({ a: 1, b: { c: 2 } });
    expect(result).toContain("a: 1");
    expect(result).toContain("b:");
    expect(result).toContain("c: 2");
  });
});

describe("compress", () => {
  it("compresses valid JSON", () => {
    const json = JSON.stringify([
      { id: 1, name: "a", value: 100 },
      { id: 2, name: "b", value: 200 },
      { id: 3, name: "c", value: 300 },
    ]);
    const result = compress(json);
    expect(result.length).toBeLessThan(json.length);
    expect(result).toContain("[3]{id,name,value}:");
  });

  it("returns original for non-JSON", () => {
    const text = "This is just plain text, not JSON";
    expect(compress(text)).toBe(text);
  });

  it("compresses even small JSON when savings exceed 10%", () => {
    const json = '{"a":1}';
    const result = compress(json);
    expect(result).toBe("a: 1");
  });
});

describe("formatObject", () => {
  it("truncates deep objects", () => {
    const deep = { a: { b: { c: { d: { e: { f: 1 } } } } } };
    const result = formatObject(deep, 3);
    expect(result).toContain("{...1 keys}");
  });
});
