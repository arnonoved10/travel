import { describe, expect, it } from "vitest";
import { getDestinationPhotos } from "./destination-photos";

describe("getDestinationPhotos", () => {
  it("matches a Thailand trip by name", () => {
    const result = getDestinationPhotos({ name: "[דמו] טיול לתאילנד", notes: null });
    expect(result).not.toBeNull();
    expect(result!.hero).toContain("wikimedia.org");
  });

  it("matches a Prague trip by name", () => {
    const result = getDestinationPhotos({ name: "[דמו] סוף שבוע בפראג", notes: null });
    expect(result).not.toBeNull();
  });

  it("returns null for an unrecognized destination — never guesses", () => {
    const result = getDestinationPhotos({ name: "טיול לירח", notes: null });
    expect(result).toBeNull();
  });
});
