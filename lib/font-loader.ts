export interface GoogleFontConfig {
  name: string;
  cssValue: string;
  weights?: string;
}

export const googleFonts: GoogleFontConfig[] = [
  { name: "Inter", cssValue: "Inter, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Poppins", cssValue: "Poppins, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Roboto", cssValue: "Roboto, sans-serif", weights: "ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900" },
  { name: "Montserrat", cssValue: "Montserrat, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Open Sans", cssValue: "Open Sans, sans-serif", weights: "ital,wght@0,300..800;1,300..800" },
  { name: "Lato", cssValue: "Lato, sans-serif", weights: "ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900" },
  { name: "Oswald", cssValue: "Oswald, sans-serif", weights: "wght@200..700" },
  { name: "Raleway", cssValue: "Raleway, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Nunito", cssValue: "Nunito, sans-serif", weights: "ital,wght@0,200..900;1,200..900" },
  { name: "Ubuntu", cssValue: "Ubuntu, sans-serif", weights: "ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700" },
  { name: "Playfair Display", cssValue: "Playfair Display, serif", weights: "ital,wght@0,400..900;1,400..900" },
  { name: "Lora", cssValue: "Lora, serif", weights: "ital,wght@0,400..700;1,400..700" },
  { name: "Merriweather", cssValue: "Merriweather, serif", weights: "ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900" },
  { name: "PT Sans", cssValue: "PT Sans, sans-serif", weights: "ital,wght@0,400;0,700;1,400;1,700" },
  { name: "PT Serif", cssValue: "PT Serif, serif", weights: "ital,wght@0,400;0,700;1,400;1,700" },
  { name: "Noto Sans", cssValue: "Noto Sans, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Kanit", cssValue: "Kanit, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Work Sans", cssValue: "Work Sans, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Outfit", cssValue: "Outfit, sans-serif", weights: "wght@100..900" },
  { name: "DM Sans", cssValue: "DM Sans, sans-serif", weights: "ital,wght@0,100..1000;1,100..1000" },
  { name: "Quicksand", cssValue: "Quicksand, sans-serif", weights: "wght@300..700" },
  { name: "Fira Sans", cssValue: "Fira Sans, sans-serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Josefin Sans", cssValue: "Josefin Sans, sans-serif", weights: "ital,wght@0,100..700;1,100..700" },
  { name: "Cabin", cssValue: "Cabin, sans-serif", weights: "ital,wght@0,400..700;1,400..700" },
  { name: "Arimo", cssValue: "Arimo, sans-serif", weights: "ital,wght@0,400..700;1,400..700" },
  { name: "Bitter", cssValue: "Bitter, serif", weights: "ital,wght@0,100..900;1,100..900" },
  { name: "Dosis", cssValue: "Dosis, sans-serif", weights: "wght@200..800" },
  { name: "Space Grotesk", cssValue: "Space Grotesk, sans-serif", weights: "wght@300..700" },
  { name: "Lexend", cssValue: "Lexend, sans-serif", weights: "wght@100..900" },
  { name: "Comfortaa", cssValue: "Comfortaa, sans-serif", weights: "wght@300..700" },
  { name: "Inconsolata", cssValue: "Inconsolata, monospace", weights: "wght@200..900" },
  { name: "Roboto Mono", cssValue: "Roboto Mono, monospace", weights: "ital,wght@0,100..700;1,100..700" },
  { name: "Source Code Pro", cssValue: "Source Code Pro, monospace", weights: "ital,wght@0,200..900;1,200..900" },
  { name: "Libre Baskerville", cssValue: "Libre Baskerville, serif", weights: "ital,wght@0,400;0,700;1,400" },
  { name: "Cinzel", cssValue: "Cinzel, serif", weights: "wght@400..900" },
  { name: "Cormorant Garamond", cssValue: "Cormorant Garamond, serif", weights: "ital,wght@0,300..700;1,300..700" },
  { name: "Crimson Pro", cssValue: "Crimson Pro, serif", weights: "ital,wght@0,200..900;1,200..900" },
  { name: "Caveat", cssValue: "Caveat, cursive", weights: "wght@400..700" },
  { name: "Dancing Script", cssValue: "Dancing Script, cursive", weights: "wght@400..700" },
  { name: "Pacifico", cssValue: "Pacifico, cursive" },
  { name: "Satisfy", cssValue: "Satisfy, cursive" },
  { name: "Lobster", cssValue: "Lobster, cursive" },
  { name: "Shadows Into Light", cssValue: "Shadows Into Light, cursive" },
  { name: "Permanent Marker", cssValue: "Permanent Marker, cursive" },
  { name: "Great Vibes", cssValue: "Great Vibes, cursive" },
  { name: "Abril Fatface", cssValue: "Abril Fatface, serif" },
  { name: "Righteous", cssValue: "Righteous, sans-serif" },
  { name: "Lilita One", cssValue: "Lilita One, sans-serif" }
];

const systemFonts = ["Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New", "Monaco", "system-ui", "sans-serif", "serif", "monospace"];

export const loadGoogleFont = (fontFamily: string) => {
  if (typeof window === "undefined") return;

  // Extract the font name from the font family string, e.g., "Poppins, sans-serif" -> "Poppins"
  const fontName = fontFamily.split(",")[0].replace(/['"]/g, "").trim();

  // If it's a standard system font, do nothing
  if (systemFonts.includes(fontName)) return;

  const fontId = `google-font-${fontName.toLowerCase().replace(/\s+/g, "-")}`;
  if (document.getElementById(fontId)) return;

  // Find configuration to know weights, fallback to regular
  const config = googleFonts.find((f) => f.name.toLowerCase() === fontName.toLowerCase());
  const encodedName = encodeURIComponent(fontName);

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";

  if (config?.weights) {
    link.href = `https://fonts.googleapis.com/css2?family=${encodedName}:${config.weights}&display=swap`;
  } else {
    link.href = `https://fonts.googleapis.com/css2?family=${encodedName}&display=swap`;
  }

  document.head.appendChild(link);
};

export const getTextWidth = (
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: number = 400,
  fontStyle: string = "normal",
  letterSpacing: number = 0
): number => {
  if (typeof window === "undefined") return text.length * (fontSize * 0.6);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return text.length * (fontSize * 0.6);

    const styleStr = fontStyle || "normal";
    const weightStr = fontWeight || 400;
    const sizeStr = `${fontSize}px`;
    const familyStr = fontFamily || "sans-serif";

    context.font = `${styleStr} ${weightStr} ${sizeStr} ${familyStr}`;
    const measured = context.measureText(text).width;
    const spacing = (letterSpacing || 0) * text.length;
    return measured + spacing;
  } catch (e) {
    return text.length * (fontSize * 0.6);
  }
};
