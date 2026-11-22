"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Icon } from "@/components/Icon";
import type { Task } from "@/lib/types";

export function TaskList() {
  const { t, lang } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [flash, setFlash] = useState("");

  async function load() {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const json = await res.json();
      setTasks(json.tasks ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function note(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2000);
  }

  async function add() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle("");
    setDue("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed, due_at: due || null }),
    });
    if (res.ok) {
      const json = await res.json();
      setTasks((ts) => [json.task, ...ts]);
      note(t("todo_added"));
    }
  }

  async function toggle(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed_at }),
    });
    if (res.ok) {
      const json = await res.json();
      setTasks((ts) => ts.map((x) => (x.id === task.id ? json.task : x)));
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) setTasks((ts) => ts.filter((x) => x.id !== id));
  }

  const open = tasks.filter((x) => !x.completed_at);
  const done = tasks.filter((x) => x.completed_at);
  const locale = lang === "ar" ? "ar-EG" : "en";

  if (loading) return <p className="sub">{t("loading")}</p>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">{t("todo_title")}</h1>
        <p className="sub mt-1">{t("todo_sub")}</p>
      </header>

      <div className="card space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            className="input min-w-48 flex-1"
            dir="auto"
            placeholder={t("todo_ph")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <input
            className="input w-auto sm:w-40"
            type="date"
            aria-label={t("todo_due")}
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <button className="btn" onClick={add} disabled={!title.trim()}>
            {t("add")}
          </button>
        </div>
        {flash && <p className="text-sm text-primary">{flash}</p>}
      </div>

      {open.length === 0 && done.length === 0 && <p className="sub">{t("todo_empty")}</p>}

      <ul className="space-y-2">
        {open.map((task) => {
          const overdue =
            task.due_at && new Date(task.due_at) < new Date(new Date().toDateString());
          return (
            <li key={task.id} className="card flex items-center gap-3 p-4">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#d96c47]"
                checked={false}
                onChange={() => toggle(task)}
                aria-label={task.title}
              />
              <span className="min-w-0 flex-1 text-[15px]" dir="auto">
                {task.title}
              </span>
              {task.due_at && (
                <span className={`shrink-0 text-xs ${overdue ? "text-rose font-medium" : "text-muted"}`}>
                  {new Date(task.due_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                </span>
              )}
              <button className="icon-btn shrink-0" onClick={() => remove(task.id)} title={t("delete")}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      {done.length > 0 && (
        <ul className="space-y-2 opacity-70">
          {done.map((task) => (
            <li key={task.id} className="card flex items-center gap-3 p-4">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#d96c47]"
                checked
                onChange={() => toggle(task)}
                aria-label={task.title}
              />
              <span className="min-w-0 flex-1 text-[15px] line-through text-muted" dir="auto">
                {task.title}
              </span>
              <button className="icon-btn shrink-0" onClick={() => remove(task.id)} title={t("delete")}>
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
