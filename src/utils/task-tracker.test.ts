import { afterEach, describe, expect, it } from "vitest";
import { clearTasks, createTask, getTasks, renderTasks, renderTasksToon, setTasks, updateTask } from "./task-tracker";

afterEach(() => clearTasks());

describe("task-tracker", () => {
  it("creates a task", () => {
    const task = createTask("Build feature");
    expect(task.content).toBe("Build feature");
    expect(task.status).toBe("pending");
    expect(getTasks()).toHaveLength(1);
  });

  it("updates task status", () => {
    const task = createTask("Test");
    updateTask(task.id, "in_progress");
    expect(getTasks()[0]!.status).toBe("in_progress");
  });

  it("completes a task", () => {
    const task = createTask("Ship it");
    updateTask(task.id, "completed");
    expect(getTasks()[0]!.status).toBe("completed");
  });

  it("bulk sets tasks", () => {
    setTasks([
      { content: "A", status: "completed" },
      { content: "B", status: "in_progress" },
      { content: "C", status: "pending" },
    ]);
    expect(getTasks()).toHaveLength(3);
    expect(getTasks()[0]!.status).toBe("completed");
    expect(getTasks()[1]!.status).toBe("in_progress");
  });

  it("clears all tasks", () => {
    createTask("One");
    createTask("Two");
    clearTasks();
    expect(getTasks()).toHaveLength(0);
  });

  it("renders ANSI output", () => {
    createTask("Build");
    const output = renderTasks();
    expect(output).toContain("Tasks");
    expect(output).toContain("Build");
    expect(output).toContain("0/1");
  });

  it("renders TOON output", () => {
    createTask("Build");
    updateTask(getTasks()[0]!.id, "completed");
    const toon = renderTasksToon();
    expect(toon).toContain("tasks[1]");
    expect(toon).toContain("completed|Build");
  });

  it("returns null for unknown task update", () => {
    expect(updateTask("nonexistent", "completed")).toBeNull();
  });
});
