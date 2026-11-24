"use client";

import { useEffect, useState } from "react";

export type User = { id: number; email: string; name: string };

/** Mocked sign-in: pick one of the seeded users. Stored in an httpOnly cookie by the API. */
export function UserBar({ onChange }: { onChange?: (me: User | null) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Server error ${r.status}`))))
      .then((d) => {
        setUsers(d.users);
        setMe(d.me);
        onChange?.(d.me);
      })
      .catch(() => setError("Can't load users. Is the database configured?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function switchUser(id: number) {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    if (!res.ok) return setError("Couldn't switch user");
    const next = users.find((u) => u.id === id) ?? null;
    setMe(next);
    onChange?.(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-gray-500">Signed in as</span>
      <select
        aria-label="Signed-in user"
        className="rounded-md border border-gray-300 bg-white px-2 py-1"
        value={me?.id ?? ""}
        onChange={(e) => switchUser(Number(e.target.value))}
      >
        <option value="" disabled>
          Choose a user…
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>
      {error && <span className="text-red-700">{error}</span>}
    </div>
  );
}
