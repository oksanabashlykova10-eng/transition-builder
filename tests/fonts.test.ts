import { describe, expect, it } from "vitest";
import { builtInFontFiles } from "../src/export/builtInFonts";

describe("autonomous built-in fonts", () => {
  it("has an embeddable source for all twelve editor fonts", () => {
    expect(Object.keys(builtInFontFiles)).toEqual([
      "Cinzel",
      "Playfair Display",
      "Cormorant Garamond",
      "Marck Script",
      "Pacifico",
      "Lobster",
      "Russo One",
      "Comfortaa",
      "Montserrat",
      "Unbounded",
      "Merriweather",
      "Caveat",
    ]);
    for (const files of Object.values(builtInFontFiles)) {
      expect(files.regular).toMatch(/\.woff2$/);
    }
  });
});
