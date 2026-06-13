/**
 * Client-side color extraction using canvas pixel sampling and k-means clustering.
 * Used to extract dominant colors from moodboard images.
 */

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert RGB to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

/**
 * Calculate distance between two RGB colors.
 */
function colorDistance(a: RGBColor, b: RGBColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * K-means clustering for colors.
 */
function kMeans(colors: RGBColor[], k: number, maxIterations: number = 20): RGBColor[] {
  if (colors.length <= k) return colors;

  // Initialize centroids using k-means++ seeding
  const centroids: RGBColor[] = [];
  centroids.push(colors[Math.floor(Math.random() * colors.length)]);

  for (let i = 1; i < k; i++) {
    const distances = colors.map((color) => {
      const minDist = Math.min(...centroids.map((c) => colorDistance(color, c)));
      return minDist * minDist;
    });
    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let random = Math.random() * totalDist;
    for (let j = 0; j < colors.length; j++) {
      random -= distances[j];
      if (random <= 0) {
        centroids.push(colors[j]);
        break;
      }
    }
    if (centroids.length <= i) {
      centroids.push(colors[Math.floor(Math.random() * colors.length)]);
    }
  }

  // Iterate
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign colors to nearest centroid
    const clusters: RGBColor[][] = Array.from({ length: k }, () => []);

    for (const color of colors) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(color, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      clusters[minIdx].push(color);
    }

    // Update centroids
    let converged = true;
    for (let i = 0; i < k; i++) {
      if (clusters[i].length === 0) continue;
      const newCentroid: RGBColor = {
        r: clusters[i].reduce((s, c) => s + c.r, 0) / clusters[i].length,
        g: clusters[i].reduce((s, c) => s + c.g, 0) / clusters[i].length,
        b: clusters[i].reduce((s, c) => s + c.b, 0) / clusters[i].length,
      };
      if (colorDistance(centroids[i], newCentroid) > 1) {
        converged = false;
      }
      centroids[i] = newCentroid;
    }

    if (converged) break;
  }

  return centroids;
}

/**
 * Sample pixels from an image URL using an offscreen canvas.
 */
async function samplePixels(imageUrl: string, sampleSize: number = 200): Promise<RGBColor[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scaleW = Math.min(sampleSize, img.width);
      const scaleH = Math.min(sampleSize, img.height);
      canvas.width = scaleW;
      canvas.height = scaleH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve([]);
        return;
      }
      ctx.drawImage(img, 0, 0, scaleW, scaleH);
      const imageData = ctx.getImageData(0, 0, scaleW, scaleH);
      const pixels: RGBColor[] = [];
      const step = 4; // Sample every 4th pixel for performance
      for (let i = 0; i < imageData.data.length; i += 4 * step) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        // Skip transparent pixels
        if (a < 128) continue;
        // Skip near-white and near-black (often backgrounds/borders)
        const brightness = (r + g + b) / 3;
        if (brightness > 245 || brightness < 10) continue;
        pixels.push({ r, g, b });
      }
      resolve(pixels);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

/**
 * Sort colors by visual distinctiveness (most saturated/vivid first).
 */
function sortByVibrancy(colors: RGBColor[]): RGBColor[] {
  return [...colors].sort((a, b) => {
    const satA = Math.max(a.r, a.g, a.b) - Math.min(a.r, a.g, a.b);
    const satB = Math.max(b.r, b.g, b.b) - Math.min(b.r, b.g, b.b);
    return satB - satA;
  });
}

/**
 * Extract dominant colors from an array of image URLs.
 *
 * @param imageUrls - Array of image URLs (can be blob: or http:)
 * @param numColors - Number of dominant colors to extract (default 5)
 * @returns Array of hex color strings sorted by vibrancy
 */
export async function extractDominantColors(
  imageUrls: string[],
  numColors: number = 5
): Promise<string[]> {
  // Collect pixels from all images
  const allPixels: RGBColor[] = [];
  for (const url of imageUrls) {
    try {
      const pixels = await samplePixels(url);
      allPixels.push(...pixels);
    } catch (err) {
      console.warn("Failed to sample pixels from:", url, err);
    }
  }

  if (allPixels.length === 0) return [];

  // Run k-means clustering
  const clusters = kMeans(allPixels, Math.min(numColors + 3, 10));

  // Sort by vibrancy and take top N
  const sorted = sortByVibrancy(clusters).slice(0, numColors);

  return sorted.map((c) => rgbToHex(c.r, c.g, c.b));
}

/**
 * Map extracted colors to design token roles.
 * Returns an object with colors assigned to: primary, bg, text, accent, secondary.
 */
export function mapColorsToTokenRoles(hexColors: string[]): {
  primary: string;
  bg: string;
  text: string;
  accent: string;
  secondary: string;
} {
  if (hexColors.length === 0) {
    return { primary: "#db2800", bg: "#faf8f5", text: "#2e2925", accent: "#8a9a86", secondary: "#64748b" };
  }

  // Simple heuristic: most vibrant = primary, lightest = bg, darkest = text
  const withLuminance = hexColors.map((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const saturation = Math.max(r, g, b) - Math.min(r, g, b);
    return { hex, luminance, saturation };
  });

  // Sort by luminance
  const byLuminance = [...withLuminance].sort((a, b) => a.luminance - b.luminance);
  // Sort by saturation
  const bySaturation = [...withLuminance].sort((a, b) => b.saturation - a.saturation);

  const darkest = byLuminance[0];
  const lightest = byLuminance[byLuminance.length - 1];
  const mostVibrant = bySaturation[0];

  // Remaining colors for accent and secondary
  const usedHexes = new Set([darkest.hex, lightest.hex, mostVibrant.hex]);
  const remaining = withLuminance.filter((c) => !usedHexes.has(c.hex));

  return {
    primary: mostVibrant.hex,
    bg: lightest.hex,
    text: darkest.hex,
    accent: remaining[0]?.hex || bySaturation[1]?.hex || "#8a9a86",
    secondary: remaining[1]?.hex || bySaturation[2]?.hex || "#64748b",
  };
}
