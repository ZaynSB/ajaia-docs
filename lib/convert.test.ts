import { describe, expect, it } from "vitest";
import { fileToDocument, markdownToHtml, textToHtml } from "./convert";

describe("file import", () => {
  it("turns markdown headings, lists and emphasis into editor HTML", () => {
    const html = markdownToHtml("# Plan\n\n- one\n- two\n\n**bold** and *italic*");
    expect(html).toContain("<h1>Plan</h1>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("escapes raw HTML so uploads can't inject scripts", () => {
    expect(markdownToHtml("<script>alert(1)</script>")).not.toContain("<script>");
    expect(textToHtml("<b>x</b>")).toBe("<p>&lt;b&gt;x&lt;/b&gt;</p>");
  });

  it("keeps paragraphs from plain text", () => {
    expect(textToHtml("a\nb\n\nc")).toBe("<p>a<br>b</p><p>c</p>");
  });

  it("uses the file name as title and rejects unsupported types", () => {
    expect(fileToDocument("Meeting notes.md", "# x").title).toBe("Meeting notes");
    expect(() => fileToDocument("report.pdf", "x")).toThrow(/Unsupported/);
  });
});
