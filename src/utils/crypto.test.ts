import { describe, expect, it } from "vitest";
import { decrypt, encrypt, isEncryptionAvailable } from "./crypto";

describe("crypto", () => {
  it("encrypts and decrypts round-trip", () => {
    const plaintext = "Hello, this is a secret message!";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.startsWith("enc:")).toBe(true);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("handles empty string", () => {
    expect(encrypt("")).toBe("");
    expect(decrypt("")).toBe("");
  });

  it("returns unencrypted text as-is on decrypt", () => {
    const plain = '{"role":"user","content":"hello"}';
    expect(decrypt(plain)).toBe(plain);
  });

  it("handles JSON content", () => {
    const json = JSON.stringify({ role: "assistant", content: "The answer is 42" });
    const encrypted = encrypt(json);
    const decrypted = decrypt(encrypted);
    expect(JSON.parse(decrypted)).toEqual({ role: "assistant", content: "The answer is 42" });
  });

  it("produces different ciphertext each time (random IV)", () => {
    const text = "same input";
    const a = encrypt(text);
    const b = encrypt(text);
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(text);
    expect(decrypt(b)).toBe(text);
  });

  it("reports encryption available", () => {
    expect(isEncryptionAvailable()).toBe(true);
  });
});
