import JSZip from "jszip";
import { downloadBlob, type ExportFonts } from "./frame-snapshot";

interface ScreenData {
  id: string;
  html: string;
  name: string;
}

const DEFAULT_FONTS: ExportFonts = {
  headingFont: "Host Grotesk",
  bodyFont: "DM Sans",
};

function buildGoogleFontsUrl(fonts: ExportFonts): string {
  const families = new Set<string>();
  families.add(fonts.headingFont.replace(/\s+/g, "+"));
  families.add(fonts.bodyFont.replace(/\s+/g, "+"));
  families.add("Inter");
  const params = Array.from(families)
    .map((f) => `family=${f}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function wrapStandaloneHTML(html: string, title: string, fonts: ExportFonts): string {
  const fontsUrl = buildGoogleFontsUrl(fonts);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="${fontsUrl}" rel="stylesheet">
  <style>
    body {
      font-family: '${fonts.bodyFont}', 'Inter', sans-serif;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: '${fonts.headingFont}', 'Inter', sans-serif;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

function generateGalleryIndex(screens: ScreenData[]): string {
  const links = screens
    .map(
      (s, i) =>
        `<a href="screens/${s.name}.html" style="display:block;padding:12px 20px;margin:6px 0;background:#f4f4f5;border-radius:10px;color:#18181b;text-decoration:none;font-weight:500;transition:background 0.2s;" onmouseover="this.style.background='#e4e4e7'" onmouseout="this.style.background='#f4f4f5'">${i + 1}. ${s.name}</a>`
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>OpenUI Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fafafa;
      margin: 0;
      padding: 40px;
      color: #18181b;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #71717a;
      font-size: 14px;
      margin-bottom: 32px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 OpenUI Export</h1>
    <p class="subtitle">${screens.length} screen${screens.length !== 1 ? "s" : ""} exported</p>
    <nav>
      ${links}
    </nav>
  </div>
</body>
</html>`;
}

export async function exportScreensAsZip(
  screens: ScreenData[],
  fonts: ExportFonts = DEFAULT_FONTS,
): Promise<void> {
  const zip = new JSZip();

  // Add gallery index
  zip.file("index.html", generateGalleryIndex(screens));

  // Add individual screens
  const screensFolder = zip.folder("screens");
  if (!screensFolder) {
    throw new Error("Failed to create screens folder in ZIP");
  }

  for (const screen of screens) {
    const html = wrapStandaloneHTML(screen.html, screen.name, fonts);
    screensFolder.file(`${screen.name}.html`, html);
  }

  // Generate and download
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `openui-export-${timestamp}.zip`);
}
