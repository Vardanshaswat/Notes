"use client";

import type React from "react";

import useSWR, { mutate } from "swr";
import { useMemo, useState } from "react";

type Note = {
  _id: string;
  title: string;
  content: string;
  labels?: string[];
  color?: string;
  pinned?: boolean;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NotesApp() {
  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [onlyPinned, setOnlyPinned] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("query", query);
    if (label) p.set("label", label);
    if (onlyPinned) p.set("pinned", "true");
    if (showArchived) p.set("archived", "true");
    return p.toString();
  }, [query, label, showArchived, onlyPinned]);

  const key = `/api/notes${qs ? `?${qs}` : ""}`;
  const { data, isLoading, error } = useSWR<Note[]>(key, fetcher);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-pretty text-2xl font-semibold">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Create, search, pin, and archive your notes.
          </p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </form>
      </header>

      <CreateNoteForm onCreated={() => mutate(key)} />

      <section
        aria-label="Filters"
        className="mt-6 rounded-md border bg-card p-3"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-600"
              aria-label="Search notes"
            />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Filter by label"
              className="w-48 rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-600"
              aria-label="Filter by label"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyPinned}
                onChange={(e) => setOnlyPinned(e.target.checked)}
              />
              Pinned
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Archived
            </label>
          </div>
        </div>
      </section>

      <section aria-busy={isLoading} className="mt-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load notes.
          </div>
        )}
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}
        {!isLoading && data && data.length === 0 && (
          <div className="text-sm text-muted-foreground">No notes found.</div>
        )}
        <ul className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          {data?.notes?.map((n) => (
            <NoteCard key={n._id} note={n} onChanged={() => mutate(key)} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function CreateNoteForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [labels, setLabels] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const disabled = saving || (!title && !content);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          labels: labels
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          color,
        }),
      });

      if (!res.ok) {
        let msg = "Failed to create";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(msg);
      }

      setTitle("");
      setContent("");
      setLabels("");
      setColor("#ffffff");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("create note error:", msg);
      setErrorMsg(msg || "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border bg-card p-3">
      {errorMsg && (
        <div
          className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {errorMsg}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="text-sm">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-600"
            placeholder="Note title"
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm">Labels (comma-separated)</label>
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-600"
              placeholder="work, todo, idea"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Note color"
              className="h-10 w-10 cursor-pointer rounded-md border"
            />
          </div>
        </div>
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="text-sm">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-24 rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-600"
            placeholder="Write your note…"
          />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          disabled={disabled}
          className={`rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white ${
            disabled ? "opacity-60" : "hover:bg-blue-700"
          }`}
        >
          {saving ? "Saving…" : "Add note"}
        </button>
      </div>
    </form>
  );
}

function NoteCard({ note, onChanged }: { note: Note; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);

  async function update(patch: Partial<Note>) {
    setBusy(true);
    try {
      await fetch(`/api/notes/${note._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Delete this note?")) return;
    setBusy(true);
    try {
      await fetch(`/api/notes/${note._id}`, { method: "DELETE" });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-md border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-balance text-base font-medium">
            {note.title || "Untitled"}
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
            {note.content}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className="inline-block h-5 w-5 rounded-sm border"
            title="Note color"
            style={{ backgroundColor: note.color || "#ffffff" }}
            aria-hidden="true"
          />
          <div className="flex gap-2">
            <button
              onClick={() => update({ pinned: !note.pinned })}
              className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              disabled={busy}
            >
              {note.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={() => update({ archived: !note.archived })}
              className="rounded-md border px-2 py-1 text-xs hover:bg-muted"
              aria-label={note.archived ? "Unarchive note" : "Archive note"}
              disabled={busy}
            >
              {note.archived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={remove}
              className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              aria-label="Delete note"
              disabled={busy}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      {note.labels && note.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.labels.map((l) => (
            <span key={l} className="rounded-md bg-muted px-2 py-0.5 text-xs">
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 text-xs text-muted-foreground">
        Updated{" "}
        {note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "—"}
      </div>
    </li>
  );
}
