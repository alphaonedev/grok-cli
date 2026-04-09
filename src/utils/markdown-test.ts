/**
 * Markdown rendering test — outputs a comprehensive markdown sample
 * to verify terminal rendering capabilities.
 *
 * Usage: grok --prompt "run markdown test" or import and call directly.
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

export const MARKDOWN_TEST = `
# Heading Level 1

## Heading Level 2

### Heading Level 3

---

This is a paragraph with **bold text**, *italic text*, and \`inline code\`. Here is a [clickable link](https://github.com/alphaonedev/grok-cli).

### Unordered List

- First item with **bold**
- Second item with \`code\`
- Third item with *italic*
  - Nested item
  - Another nested item

### Ordered List

1. Step one — install grok-cli
2. Step two — configure API key
3. Step three — start coding

### Code Block (JavaScript)

\`\`\`javascript
const grok = require('grok-cli');

async function main() {
  const agent = new grok.Agent({
    model: 'grok-4-1-fast-reasoning',
    apiKey: process.env.GROK_API_KEY,
  });

  const result = await agent.run('Hello world');
  console.log(result);
}

main();
\`\`\`

### Code Block (Python)

\`\`\`python
import requests

def call_grok(prompt: str) -> str:
    response = requests.post(
        "https://api.x.ai/v1/responses",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"model": "grok-4-1-fast-reasoning", "input": prompt}
    )
    return response.json()["output_text"]

# Example usage
result = call_grok("What is TOON compression?")
print(result)
\`\`\`

### Table

| Model | Context | Input $/M | Output $/M | Best For |
|-------|---------|-----------|------------|----------|
| grok-4.20-reasoning | 2M | $2.00 | $6.00 | Architecture, debugging |
| grok-4-1-fast-reasoning | 2M | $0.20 | $0.50 | **Default** — daily coding |
| grok-4-1-fast-non-reasoning | 2M | $0.20 | $0.50 | Docs, transforms |

### Blockquote

> "The best AI coding agent is the one that remembers what you told it yesterday."
> — AlphaOne LLC

### Nested Formatting

This paragraph has **bold with \`code inside\`** and *italic with \`code inside\`*. Here is a **[bold link](https://alphaonedev.github.io/grok-cli/)**.

---

If all elements above render with colors, styling, and formatting, markdown rendering is working correctly.
`;

/**
 * Print the markdown test to stdout for headless verification.
 */
export function printMarkdownTest(): void {
  process.stdout.write(MARKDOWN_TEST);
}
