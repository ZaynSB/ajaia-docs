"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type ChangeEvent } from "react";
import { UserBar, type User } from "@/components/UserBar";

type DocRow = { id: string; title: string; updated_at: string; owner_name?: string };

const fmt = (d: string) => new Date(d).toLocaleString();

export default function Home() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [owned, setOwned] = useState<DocRow[]>([]);
  const [shared, setShared] = useState<DocRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (user: User | null) => {
    setMe(user);
    setError(null);
    if (!user) return;
    const res = await fetch("/api/documents");
    if (!res.ok) return setError("Couldn't load documents");
    const data = await res.json();
    setOwned(data.owned);
    setShared(data.shared);
  }, []);

  async function createDoc() {
    setBusy(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled document" }),
    });
    setBusy(false);
    if (!res.ok) return setError("Couldn't create document");
    router.push(`/docs/${(await res.json()).id}`);
  }

  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Upload failed");
    router.push(`/docs/${data.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Ajaia Docs</h1>
        <UserBar onChange={load} />
      </header>

      {!me ? (
        <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-gray-600">
          Choose a user above to see their documents. Try Alice, share a document with Bob, then switch to Bob.
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              onClick={createDoc}
              disabled={busy}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              + New document
            </button>
            <label className="cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50">
              Import .txt / .md
              <input type="file" accept=".txt,.md,text/plain,text/markdown" className="hidden" onChange={upload} disabled={busy} />
            </label>
            <span className="text-xs text-gray-500">Supported imports: .txt and .md, up to 1 MB</span>
          </div>
          {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}

          <section className="mb-8">
            <h2 className="mb-2 text-lg font-semibold">My documents ({owned.length})</h2>
            <DocList docs={owned} empty="No documents yet. Create one or import a file." />
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold">Shared with me ({shared.length})</h2>
            <DocList docs={shared} empty="Nothing has been shared with you yet." />
          </section>
        </>
      )}
    </main>
  );
}

function DocList({ docs, empty }: { docs: DocRow[]; empty: string }) {
  if (docs.length === 0) return <p className="text-sm text-gray-500">{empty}</p>;
  return (
    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 bg-white">
      {docs.map((d) => (
        <li key={d.id}>
          <Link href={`/docs/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
            <span className="font-medium">{d.title}</span>
            <span className="text-xs text-gray-500">
              {d.owner_name ? `Owner: ${d.owner_name} · ` : ""}
              {fmt(d.updated_at)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
