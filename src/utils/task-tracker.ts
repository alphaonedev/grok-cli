/**
 * Task/Todo Tracker — in-session task management for the agent.
 *
 * Provides Claude Code-style task tracking that the agent can update
 * during execution. Tasks are visible in both interactive UI and
 * headless output.
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

export interface Task {
  id: string;
  content: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
}

const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: "○",
  in_progress: "◉",
  completed: "✓",
  failed: "✗",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "\x1b[90m", // gray
  in_progress: "\x1b[36m", // cyan
  completed: "\x1b[32m", // green
  failed: "\x1b[31m", // red
};

let _tasks: Task[] = [];
let _nextId = 1;
let _listeners: Array<() => void> = [];

/**
 * Add a change listener (for UI updates).
 */
export function onTaskChange(listener: () => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
}

function notify(): void {
  for (const l of _listeners) l();
}

/**
 * Create a new task.
 */
export function createTask(content: string, status: TaskStatus = "pending"): Task {
  const task: Task = {
    id: `task-${_nextId++}`,
    content,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  _tasks.push(task);
  notify();
  return task;
}

/**
 * Update a task's status.
 */
export function updateTask(id: string, status: TaskStatus): Task | null {
  const task = _tasks.find((t) => t.id === id);
  if (!task) return null;
  task.status = status;
  task.updatedAt = Date.now();
  notify();
  return task;
}

/**
 * Replace all tasks (bulk update).
 */
export function setTasks(tasks: Array<{ content: string; status: TaskStatus }>): void {
  _tasks = tasks.map((t, i) => ({
    id: `task-${i + 1}`,
    content: t.content,
    status: t.status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
  _nextId = _tasks.length + 1;
  notify();
}

/**
 * Get all tasks.
 */
export function getTasks(): readonly Task[] {
  return _tasks;
}

/**
 * Clear all tasks.
 */
export function clearTasks(): void {
  _tasks = [];
  _nextId = 1;
  notify();
}

/**
 * Render tasks as ANSI-formatted terminal output.
 */
export function renderTasks(): string {
  if (_tasks.length === 0) return "";

  const lines = ["\x1b[1mTasks\x1b[0m"];
  for (const task of _tasks) {
    const icon = STATUS_ICONS[task.status];
    const color = STATUS_COLORS[task.status];
    const strike = task.status === "completed" ? "\x1b[9m" : "";
    lines.push(`  ${color}${icon}\x1b[0m ${strike}${task.content}\x1b[0m`);
  }

  const completed = _tasks.filter((t) => t.status === "completed").length;
  const total = _tasks.length;
  if (total > 0) {
    lines.push(`\x1b[90m  ${completed}/${total} complete\x1b[0m`);
  }

  return lines.join("\n");
}

/**
 * Render tasks as TOON-compact format for LLM context.
 */
export function renderTasksToon(): string {
  if (_tasks.length === 0) return "";
  const rows = _tasks.map((t) => `${t.status}|${t.content}`);
  return `tasks[${_tasks.length}]{status,content}:\n${rows.map((r) => `  ${r}`).join("\n")}`;
}
