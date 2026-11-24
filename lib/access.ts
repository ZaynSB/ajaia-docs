// Pure access rules, kept free of I/O so they are easy to unit test.
export type Role = "owner" | "editor";

export function roleFor(doc: { owner_id: number }, sharedUserIds: number[], userId: number | null): Role | null {
  if (userId == null) return null;
  if (doc.owner_id === userId) return "owner";
  if (sharedUserIds.includes(userId)) return "editor";
  return null;
}

export const canEdit = (role: Role | null) => role !== null;
export const canShare = (role: Role | null) => role === "owner";
export const canDelete = (role: Role | null) => role === "owner";
