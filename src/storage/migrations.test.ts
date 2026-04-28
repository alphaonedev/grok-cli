import { describe, expect, it } from "vitest";
import type { SQLiteDatabase, SQLiteStatement } from "./db";
import { applyMigrations } from "./migrations";

/**
 * Minimal in-memory mock of SQLiteDatabase that records the SQL calls
 * applyMigrations issues. Vitest runs under Node where `bun:sqlite`
 * isn't available, so we exercise the migration sequence symbolically.
 */
interface MockHandle {
  db: SQLiteDatabase;
  exec: string[];
  pragmaWrites: string[];
  pragmaReads: string[];
  /** Mutable counter — read after applyMigrations has run. */
  state: { transactions: number };
}

function createMockDb(initialUserVersion = 0): MockHandle {
  let userVersion = initialUserVersion;
  const exec: string[] = [];
  const pragmaWrites: string[] = [];
  const pragmaReads: string[] = [];
  const state = { transactions: 0 };

  const noopStatement: SQLiteStatement = {
    run: () => undefined,
    get: () => undefined,
    all: () => [],
  };

  const db: SQLiteDatabase = {
    exec: (sql) => {
      exec.push(sql);
    },
    prepare: () => noopStatement,
    pragma: (query, options) => {
      if (query.includes("=")) {
        pragmaWrites.push(query);
        const match = query.match(/user_version\s*=\s*(\d+)/);
        if (match?.[1]) {
          userVersion = Number.parseInt(match[1], 10);
        }
        return undefined;
      }
      pragmaReads.push(query);
      if (query === "user_version") {
        return options?.simple ? userVersion : { user_version: userVersion };
      }
      return undefined;
    },
    transaction: <T>(fn: () => T) => {
      return () => {
        state.transactions += 1;
        return fn();
      };
    },
    close: () => undefined,
  };

  return { db, exec, pragmaWrites, pragmaReads, state };
}

describe("applyMigrations", () => {
  it("applies all migrations on a fresh db (user_version 0 -> 2)", () => {
    const { db, exec, pragmaWrites, state } = createMockDb(0);

    applyMigrations(db);

    expect(state.transactions).toBe(1);
    expect(pragmaWrites).toEqual(["user_version = 1", "user_version = 2"]);
    // Exec'd at least the initial schema and the v2 compactions schema.
    expect(exec.join("\n")).toContain("CREATE TABLE IF NOT EXISTS workspaces");
    expect(exec.join("\n")).toContain("CREATE TABLE IF NOT EXISTS sessions");
    expect(exec.join("\n")).toContain("CREATE TABLE IF NOT EXISTS compactions");
  });

  it("is a no-op when already at latest", () => {
    const { db, exec, pragmaWrites, state } = createMockDb(2);

    applyMigrations(db);

    expect(state.transactions).toBe(0);
    expect(pragmaWrites).toEqual([]);
    expect(exec).toEqual([]);
  });

  it("only runs the v2 compaction step when starting from v1", () => {
    const { db, exec, pragmaWrites, state } = createMockDb(1);

    applyMigrations(db);

    expect(state.transactions).toBe(1);
    expect(pragmaWrites).toEqual(["user_version = 2"]);
    // v1 already has the initial workspaces/sessions tables, so the
    // initial schema exec should NOT have run again.
    expect(exec.join("\n")).not.toContain("CREATE TABLE IF NOT EXISTS workspaces");
    expect(exec.join("\n")).toContain("CREATE TABLE IF NOT EXISTS compactions");
  });

  it("wraps all migrations in a single transaction", () => {
    const { db, state } = createMockDb(0);
    applyMigrations(db);
    expect(state.transactions).toBe(1);
  });
});
