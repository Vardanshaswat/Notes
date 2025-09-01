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

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((res) => res.notes || res);

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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-500 mt-1">
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
          <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            Sign out
          </button>
        </form>
      </header>

      {/* Create Note Form */}
      <CreateNoteForm onCreated={() => mutate(key)} />

      {/* Filters */}
      <section
        aria-label="Filters"
        className="mt-6 rounded-xl border bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex flex-1 gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="flex-1 rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {/* <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Filter by label"
              className="w-48 rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            /> */}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-500"
                checked={onlyPinned}
                onChange={(e) => setOnlyPinned(e.target.checked)}
              />
              Pinned
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-500"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Archived
            </label>
          </div>
        </div>
      </section>

      {/* Notes List */}
      <section aria-busy={isLoading} className="mt-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Failed to load notes.
          </div>
        )}
        {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
        {!isLoading && data && data.length === 0 && (
          <div className="text-sm text-gray-500">No notes found.</div>
        )}

        <ul className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          {data?.map((n) => (
            <NoteCard key={n._id} note={n} onChanged={() => mutate(key)} />
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- CreateNoteForm ----------
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
        } catch {}
        throw new Error(msg);
      }

      setTitle("");
      setContent("");
      setLabels("");
      setColor("#ffffff");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg || "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-xl bg-white p-4 shadow-sm grid gap-4"
    >
      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <input
        value={labels}
        onChange={(e) => setLabels(e.target.value)}
        placeholder="Labels (comma-separated)"
        className="rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded-lg border"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note…"
          className="flex-1 min-h-[6rem] rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={disabled}
        className={`self-end rounded-full bg-blue-600 text-white px-6 py-2 font-medium transition ${
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {saving ? "Saving…" : "Add Note"}
      </button>
    </form>
  );
}

// ---------- NoteCard ----------
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
    <li className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {note.title || "Untitled"}
          </h3>
          <p className="mt-1 text-gray-600 text-sm leading-6 whitespace-pre-wrap">
            {note.content}
          </p>
          {note.labels && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.labels.map((l) => (
                <span
                  key={l}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className="h-5 w-5 rounded border"
            style={{ backgroundColor: note.color || "#ffffff" }}
            title="Note color"
            aria-hidden="true"
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => update({ pinned: !note.pinned })}
              disabled={busy}
              className="text-xs px-3 py-1 rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition"
            >
              {note.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={() => update({ archived: !note.archived })}
              disabled={busy}
              className="text-xs px-3 py-1 rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition"
            >
              {note.archived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="text-xs px-3 py-1 rounded-full border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Updated{" "}
        {note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "—"}
      </div>
    </li>
  );
}
