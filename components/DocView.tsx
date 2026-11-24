"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DocEditor } from "@/components/DocEditor";

type Person = { id: number; email: string; name: string };
type DocData = {
  id: string;
  title: string;
  content: string;
  role: "owner" | "editor";
  owner: { name: string; email: string };
  sharedWith: Person[];
};
type SaveState = "saved" | "unsaved" | "saving" | "error";

const SAVE_DELAY_MS = 800;

export function DocView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [doc, setDoc] = useState<DocData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [save, setSave] = useState<SaveState>("saved");
  const pending = useRef<{ title?: string; content?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`);
        setDoc(data);
        setTitle(data.title);
      })
      .catch((e: Error) => setLoadError(e.message));
  }, [id]);

  // Debounced autosave: batch edits and send one PATCH after the user pauses typing.
  const flush = useCallback(async () => {
    const body = pending.current;
    if (Object.keys(body).length === 0) return;
    pending.current = {};
    setSave("saving");
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    if (!res?.ok) {
      pending.current = { ...body, ...pending.current }; // keep unsaved changes for the retry
      setSave("error");
      return;
    }
    setSave(Object.keys(pending.current).length ? "unsaved" : "saved");
  }, [id]);

  const queue = useCallback(
    (change: { title?: string; content?: string }) => {
      pending.current = { ...pending.current, ...change };
      setSave("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  if (loadError)
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p role="alert" className="mb-4 text-red-700">{loadError}</p>
        <Link href="/" className="text-blue-700 underline">Back to documents</Link>
      </main>
    );
  if (!doc) return <main className="mx-auto max-w-3xl px-4 py-10 text-gray-500">Loading…</main>;

  async function deleteDoc() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    if (timer.current) clearTimeout(timer.current);
    pending.current = {}; // don't autosave a document we're deleting
    setDeleting(true);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setDeleting(false);
      const data = await res?.json().catch(() => ({}));
      window.alert(data?.error ?? "Couldn't delete the document");
      return;
    }
    router.push("/");
  }

  const status = { saved: "All changes saved", unsaved: "Unsaved changes…", saving: "Saving…", error: "Save failed. Retrying on next edit" }[save];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-blue-700 hover:underline">← Documents</Link>
        <input
          aria-label="Document title"
          value={title}
          maxLength={200}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) queue({ title: e.target.value.trim() });
          }}
          className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-xl font-semibold hover:border-gray-300 focus:border-blue-500 focus:outline-none"
        />
        <span className={`text-xs ${save === "error" ? "text-red-700" : "text-gray-500"}`} aria-live="polite">{status}</span>
        {doc.role === "owner" && (
          <button
            onClick={deleteDoc}
            disabled={deleting}
            className="rounded-md border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-gray-500">
        {doc.role === "owner" ? "You own this document." : `Shared with you by ${doc.owner.name}. You can edit.`}
      </p>

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <DocEditor content={doc.content} onChange={(html) => queue({ content: html })} />
        <SharePanel doc={doc} onChange={(sharedWith) => setDoc({ ...doc, sharedWith })} />
      </div>
    </main>
  );
}

function SharePanel({ doc, onChange }: { doc: DocData; onChange: (p: Person[]) => void }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const isOwner = doc.role === "owner";

  async function share(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch(`/api/documents/${doc.id}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Couldn't share" });
    if (!doc.sharedWith.some((p) => p.id === data.sharedWith.id)) onChange([...doc.sharedWith, data.sharedWith]);
    setMsg({ ok: true, text: `Shared with ${data.sharedWith.name}` });
    setEmail("");
  }

  async function revoke(userId: number) {
    const res = await fetch(`/api/documents/${doc.id}/share?userId=${userId}`, { method: "DELETE" });
    if (res.ok) onChange(doc.sharedWith.filter((p) => p.id !== userId));
    else setMsg({ ok: false, text: "Couldn't remove access" });
  }

  return (
    <aside className="h-fit rounded-md border border-gray-200 bg-white p-4 text-sm shadow-sm">
      <h2 className="mb-2 font-semibold">Sharing</h2>
      <p className="mb-2 text-gray-600">Owner: {doc.owner.name}</p>
      <ul className="mb-3 space-y-1">
        {doc.sharedWith.length === 0 && <li className="text-gray-500">Not shared yet.</li>}
        {doc.sharedWith.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2">
            <span>{p.name} <span className="text-gray-500">(can edit)</span></span>
            {isOwner && (
              <button onClick={() => revoke(p.id)} className="text-xs text-red-700 hover:underline" aria-label={`Remove ${p.name}`}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {isOwner ? (
        <form onSubmit={share} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="bob@ajaia.test"
            aria-label="Share with email"
            className="w-full rounded-md border border-gray-300 px-2 py-1"
          />
          <button className="w-full rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700">Share</button>
        </form>
      ) : (
        <p className="text-gray-500">Only the owner can change sharing.</p>
      )}
      {msg && <p role="status" className={`mt-2 ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</p>}
    </aside>
  );
}
