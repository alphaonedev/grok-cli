import { describe, expect, it } from "vitest";
import { containsMarkdown, renderMarkdown } from "./terminal-markdown";

describe("containsMarkdown", () => {
  it("detects headers", () => {
    expect(containsMarkdown("# Hello")).toBe(true);
    expect(containsMarkdown("## Section")).toBe(true);
  });

  it("detects code blocks", () => {
    expect(containsMarkdown("```js\nconsole.log(1)\n```")).toBe(true);
  });

  it("detects bold", () => {
    expect(containsMarkdown("This is **bold** text")).toBe(true);
  });

  it("detects links", () => {
    expect(containsMarkdown("[click](https://example.com)")).toBe(true);
  });

  it("detects lists", () => {
    expect(containsMarkdown("- item one\n- item two")).toBe(true);
  });

  it("detects tables", () => {
    expect(containsMarkdown("| col1 | col2 |")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(containsMarkdown("Just a simple sentence.")).toBe(false);
  });
});

describe("renderMarkdown", () => {
  it("renders headers with ANSI bold", () => {
    const result = renderMarkdown("# Title");
    expect(result).toContain("\x1b[1m");
    expect(result).toContain("Title");
  });

  it("renders inline code", () => {
    const result = renderMarkdown("Use `npm install` to install");
    expect(result).toContain("npm install");
  });

  it("renders bold text", () => {
    const result = renderMarkdown("This is **important**");
    expect(result).toContain("\x1b[1m");
    expect(result).toContain("important");
  });

  it("renders bullet lists", () => {
    const result = renderMarkdown("- first\n- second");
    expect(result).toContain("•");
    expect(result).toContain("first");
    expect(result).toContain("second");
  });

  it("renders code blocks", () => {
    const result = renderMarkdown("```js\nconst x = 1;\n```");
    expect(result).toContain("js");
    expect(result).toContain("const");
  });

  it("renders blockquotes", () => {
    const result = renderMarkdown("> A wise quote");
    expect(result).toContain("│");
    expect(result).toContain("A wise quote");
  });

  it("passes plain text through", () => {
    const result = renderMarkdown("Hello world");
    expect(result).toContain("Hello world");
  });
});
