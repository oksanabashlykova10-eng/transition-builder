import cinzel400 from "@fontsource/cinzel/files/cinzel-latin-ext-400-normal.woff2?url";
import cinzel700 from "@fontsource/cinzel/files/cinzel-latin-ext-700-normal.woff2?url";
import playfair400 from "@fontsource/playfair-display/files/playfair-display-cyrillic-400-normal.woff2?url";
import playfair700 from "@fontsource/playfair-display/files/playfair-display-cyrillic-700-normal.woff2?url";
import cormorant400 from "@fontsource/cormorant-garamond/files/cormorant-garamond-cyrillic-ext-400-normal.woff2?url";
import cormorant700 from "@fontsource/cormorant-garamond/files/cormorant-garamond-cyrillic-ext-700-normal.woff2?url";
import marck400 from "@fontsource/marck-script/files/marck-script-cyrillic-400-normal.woff2?url";
import pacifico400 from "@fontsource/pacifico/files/pacifico-cyrillic-ext-400-normal.woff2?url";
import lobster400 from "@fontsource/lobster/files/lobster-cyrillic-ext-400-normal.woff2?url";
import russo400 from "@fontsource/russo-one/files/russo-one-cyrillic-400-normal.woff2?url";
import comfortaa400 from "@fontsource/comfortaa/files/comfortaa-cyrillic-ext-400-normal.woff2?url";
import comfortaa700 from "@fontsource/comfortaa/files/comfortaa-cyrillic-ext-700-normal.woff2?url";
import montserrat400 from "@fontsource/montserrat/files/montserrat-cyrillic-ext-400-normal.woff2?url";
import montserrat800 from "@fontsource/montserrat/files/montserrat-cyrillic-ext-800-normal.woff2?url";
import unbounded400 from "@fontsource/unbounded/files/unbounded-cyrillic-400-normal.woff2?url";
import unbounded700 from "@fontsource/unbounded/files/unbounded-cyrillic-700-normal.woff2?url";
import merriweather400 from "@fontsource/merriweather/files/merriweather-cyrillic-ext-400-normal.woff2?url";
import merriweather700 from "@fontsource/merriweather/files/merriweather-cyrillic-ext-700-normal.woff2?url";
import caveat400 from "@fontsource/caveat/files/caveat-cyrillic-ext-400-normal.woff2?url";
import caveat700 from "@fontsource/caveat/files/caveat-cyrillic-ext-700-normal.woff2?url";

interface FontFiles {
  regular: string;
  bold?: string;
  boldWeight?: number;
}
export const builtInFontFiles: Record<string, FontFiles> = {
  Cinzel: { regular: cinzel400, bold: cinzel700, boldWeight: 700 },
  "Playfair Display": {
    regular: playfair400,
    bold: playfair700,
    boldWeight: 700,
  },
  "Cormorant Garamond": {
    regular: cormorant400,
    bold: cormorant700,
    boldWeight: 700,
  },
  "Marck Script": { regular: marck400 },
  Pacifico: { regular: pacifico400 },
  Lobster: { regular: lobster400 },
  "Russo One": { regular: russo400 },
  Comfortaa: { regular: comfortaa400, bold: comfortaa700, boldWeight: 700 },
  Montserrat: { regular: montserrat400, bold: montserrat800, boldWeight: 800 },
  Unbounded: { regular: unbounded400, bold: unbounded700, boldWeight: 700 },
  Merriweather: {
    regular: merriweather400,
    bold: merriweather700,
    boldWeight: 700,
  },
  Caveat: { regular: caveat400, bold: caveat700, boldWeight: 700 },
};
