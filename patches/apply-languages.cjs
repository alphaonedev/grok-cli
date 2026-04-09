#!/usr/bin/env node
/**
 * Patch OpenTUI's parser registry to add additional language parsers.
 *
 * OpenTUI hardcodes 5 languages (JS, TS, Markdown, Markdown_inline, Zig).
 * This script patches the compiled JS to add Python, Go, Rust, Java, C, C++,
 * C#, Ruby, PHP, Bash, JSON, HTML, CSS, Scala, and their highlight queries.
 *
 * Run after `bun install` via the postinstall script.
 */

const fs = require("fs");
const path = require("path");

const CORE_JS = path.join(__dirname, "..", "node_modules", "@opentui", "core", "index-kgg0v67t.js");

if (!fs.existsSync(CORE_JS)) {
  // Try to find the correct file
  const dir = path.join(__dirname, "..", "node_modules", "@opentui", "core");
  const files = fs.readdirSync(dir).filter((f) => f.startsWith("index-") && f.endsWith(".js") && !f.includes("map"));
  if (files.length === 0) {
    console.log("  [languages] OpenTUI core JS not found, skipping");
    process.exit(0);
  }
}

const content = fs.readFileSync(CORE_JS, "utf8");

// Find the closing of the parsers array: `    ]\n  }\n`
// We need to inject new parser entries before the closing `]`
const ASSETS_DIR = path.join(__dirname, "..", "node_modules", "@opentui", "core", "assets");

// Languages to add (those with .wasm files in assets)
const EXTRA_LANGUAGES = [
  "python",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
  "c_sharp",
  "ruby",
  "php",
  "bash",
  "json",
  "html",
  "css",
  "scala",
];

// Build import statements and parser entries
const imports = [];
const entries = [];

for (const lang of EXTRA_LANGUAGES) {
  const langDir = path.join(ASSETS_DIR, lang.replace("_", "-"));
  const wasmFiles = fs.readdirSync(langDir).filter((f) => f.endsWith(".wasm"));
  if (wasmFiles.length === 0) continue;

  const wasmFile = wasmFiles[0];
  const varName = `${lang}_language`;
  const importPath = `./assets/${lang.replace("_", "-")}/${wasmFile}`;

  imports.push(`import ${varName} from "${importPath}" with { type: "file" };`);

  // Map language names to common aliases used in markdown code fences
  const aliases = {
    python: ["python", "py"],
    go: ["go", "golang"],
    rust: ["rust", "rs"],
    java: ["java"],
    c: ["c"],
    cpp: ["cpp", "c++", "cxx"],
    c_sharp: ["csharp", "c#", "cs"],
    ruby: ["ruby", "rb"],
    php: ["php"],
    bash: ["bash", "sh", "shell", "zsh"],
    json: ["json"],
    html: ["html", "htm"],
    css: ["css"],
    scala: ["scala"],
  };

  const filetypeAliases = aliases[lang] || [lang];
  for (const ft of filetypeAliases) {
    entries.push(`      {
        filetype: "${ft}",
        wasm: resolve(dirname(fileURLToPath(import.meta.url)), ${varName})
      }`);
  }
}

// Inject imports after the existing zig import
let patched = content;
const zigImportLine = 'import zig_language from "./assets/zig/tree-sitter-zig.wasm" with { type: "file" };';
if (patched.includes(zigImportLine)) {
  patched = patched.replace(zigImportLine, zigImportLine + "\n" + imports.join("\n"));
}

// Inject parser entries before the closing `]` of the parsers array
// Find: `wasm: resolve(dirname(fileURLToPath(import.meta.url)), zig_language)\n      }\n    ];`
const zigEntry = "wasm: resolve(dirname(fileURLToPath(import.meta.url)), zig_language)\n      }\n    ];";
if (patched.includes(zigEntry)) {
  patched = patched.replace(
    zigEntry,
    "wasm: resolve(dirname(fileURLToPath(import.meta.url)), zig_language)\n      },\n" +
      entries.join(",\n") +
      "\n    ];",
  );
}

if (patched !== content) {
  fs.writeFileSync(CORE_JS, patched);
  console.log(`  [languages] Patched OpenTUI with ${EXTRA_LANGUAGES.length} additional language parsers`);
} else {
  console.log("  [languages] No changes needed (already patched or structure changed)");
}
