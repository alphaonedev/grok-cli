import { describe, expect, it } from "vitest";
import { getMatchingHooks } from "./config";
import type { HookInput, HooksConfig } from "./types";
import { getMatchQuery, HOOK_EVENTS, isHookEvent } from "./types";

describe("isHookEvent", () => {
  it("accepts every event listed in HOOK_EVENTS", () => {
    for (const event of HOOK_EVENTS) {
      expect(isHookEvent(event)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isHookEvent("Bogus")).toBe(false);
    expect(isHookEvent("")).toBe(false);
    expect(isHookEvent("pretooluse")).toBe(false); // case-sensitive
  });
});

describe("getMatchingHooks", () => {
  const dummyHook = { type: "command" as const, command: "echo $TOOL" };

  it("returns nothing when the event has no configured matchers", () => {
    const config: HooksConfig = {};
    expect(getMatchingHooks(config, "PreToolUse", "bash")).toEqual([]);
  });

  it("returns matchers with no `matcher` field — they match everything", () => {
    const config: HooksConfig = {
      PreToolUse: [{ hooks: [dummyHook] }],
    };
    expect(getMatchingHooks(config, "PreToolUse", "bash")).toEqual([dummyHook]);
    expect(getMatchingHooks(config, "PreToolUse", "edit_file")).toEqual([dummyHook]);
    expect(getMatchingHooks(config, "PreToolUse", undefined)).toEqual([dummyHook]);
  });

  it("filters by matcher when one is specified", () => {
    const bashHook = { type: "command" as const, command: "echo bash" };
    const editHook = { type: "command" as const, command: "echo edit" };
    const config: HooksConfig = {
      PreToolUse: [
        { matcher: "bash", hooks: [bashHook] },
        { matcher: "edit_file", hooks: [editHook] },
      ],
    };
    expect(getMatchingHooks(config, "PreToolUse", "bash")).toEqual([bashHook]);
    expect(getMatchingHooks(config, "PreToolUse", "edit_file")).toEqual([editHook]);
    expect(getMatchingHooks(config, "PreToolUse", "other")).toEqual([]);
  });

  it("does not match a specific-matcher hook when matchValue is undefined", () => {
    const config: HooksConfig = {
      PreToolUse: [{ matcher: "bash", hooks: [dummyHook] }],
    };
    expect(getMatchingHooks(config, "PreToolUse", undefined)).toEqual([]);
  });

  it("collects hooks from multiple matching matcher entries", () => {
    const wildcard = { type: "command" as const, command: "all" };
    const specific = { type: "command" as const, command: "bash-only" };
    const config: HooksConfig = {
      PreToolUse: [{ hooks: [wildcard] }, { matcher: "bash", hooks: [specific] }],
    };
    expect(getMatchingHooks(config, "PreToolUse", "bash")).toEqual([wildcard, specific]);
  });
});

describe("getMatchQuery", () => {
  const baseInput = { cwd: "/tmp", session_id: "ses_test" };

  it("returns tool_name for PreToolUse / PostToolUse / PostToolUseFailure", () => {
    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "PreToolUse",
        tool_name: "bash",
        tool_input: {},
      } as HookInput),
    ).toBe("bash");

    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "PostToolUse",
        tool_name: "edit_file",
        tool_input: {},
        tool_output: {},
      } as HookInput),
    ).toBe("edit_file");

    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "PostToolUseFailure",
        tool_name: "write_file",
        tool_input: {},
        error: "boom",
      } as HookInput),
    ).toBe("write_file");
  });

  it("returns source for SessionStart", () => {
    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "SessionStart",
        source: "resume",
      } as HookInput),
    ).toBe("resume");
  });

  it("returns agent_type for subagent and task events", () => {
    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "SubagentStart",
        agent_type: "verify",
        description: "x",
      } as HookInput),
    ).toBe("verify");

    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "TaskCompleted",
        agent_type: "Explore",
        description: "x",
        success: true,
      } as HookInput),
    ).toBe("Explore");
  });

  it("returns trigger for compaction events", () => {
    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "PreCompact",
        trigger: "auto",
      } as HookInput),
    ).toBe("auto");
  });

  it("returns undefined for events without a query field", () => {
    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "Stop",
      } as HookInput),
    ).toBeUndefined();

    expect(
      getMatchQuery({
        ...baseInput,
        hook_event_name: "Notification",
        message: "hi",
      } as unknown as HookInput),
    ).toBeUndefined();
  });
});
