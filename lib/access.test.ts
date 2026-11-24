import { describe, expect, it } from "vitest";
import { canEdit, canShare, roleFor } from "./access";

describe("document access rules", () => {
  const doc = { owner_id: 1 };

  it("gives the owner full rights", () => {
    const role = roleFor(doc, [], 1);
    expect(role).toBe("owner");
    expect(canEdit(role) && canShare(role)).toBe(true);
  });

  it("lets a shared user edit but not re-share", () => {
    const role = roleFor(doc, [2], 2);
    expect(role).toBe("editor");
    expect(canEdit(role)).toBe(true);
    expect(canShare(role)).toBe(false);
  });

  it("denies a user the document was not shared with", () => {
    const role = roleFor(doc, [2], 3);
    expect(role).toBeNull();
    expect(canEdit(role)).toBe(false);
  });

  it("denies anonymous requests", () => {
    expect(roleFor(doc, [2], null)).toBeNull();
  });
});
