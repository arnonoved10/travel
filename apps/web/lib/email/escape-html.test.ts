import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("escapes all five HTML-significant characters", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });

  it("leaves plain text (including Hebrew) untouched", () => {
    expect(escapeHtml("טיול לתאילנד 2026")).toBe("טיול לתאילנד 2026");
  });

  it("handles an empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});
