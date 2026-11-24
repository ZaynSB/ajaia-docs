import { Suspense } from "react";
import { DocView } from "@/components/DocView";

// The document id is only known at request time, so the client view renders inside Suspense.
export default function DocPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-10 text-gray-500">Loading…</main>}>
      <DocView />
    </Suspense>
  );
}
