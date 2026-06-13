/**
 * Utility functions for calculating WCAG color contrast ratios and checking compliance.
 */

export function hexToRgb(hex: string): [number, number, number] | null {
  // Remove hash if present
  const cleanHex = hex.replace(/^#/, "");
  
  if (cleanHex.length !== 3 && cleanHex.length !== 6) {
    return null;
  }
  
  let r = 0, g = 0, b = 0;
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  
  return [r, g, b];
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = relativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = relativeLuminance(rgb2[0], rgb2[1], rgb2[2]);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  const ratio = (lighter + 0.05) / (darker + 0.05);
  // Round to 2 decimal places
  return Math.round(ratio * 100) / 100;
}

export function getWCAGLevel(ratio: number, isLargeText: boolean = false): "AAA" | "AA" | "Fail" {
  if (isLargeText) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3.0) return "AA";
    return "Fail";
  } else {
    if (ratio >= 7.0) return "AAA";
    if (ratio >= 4.5) return "AA";
    return "Fail";
  }
}

/**
 * Checks if a contrast passes AA or AAA level
 */
export function checkContrast(hex1: string, hex2: string, isLargeText: boolean = false) {
  const ratio = contrastRatio(hex1, hex2);
  const level = getWCAGLevel(ratio, isLargeText);
  return {
    ratio,
    level,
    isValid: level !== "Fail",
  };
}

/**
 * Returns a simple recommendation of how to improve contrast.
 */
export function getContrastRecommendation(hexText: string, hexBg: string): string {
  const ratio = contrastRatio(hexText, hexBg);
  if (ratio >= 4.5) return "Contrast is acceptable.";
  
  const rgbText = hexToRgb(hexText);
  const rgbBg = hexToRgb(hexBg);
  if (!rgbText || !rgbBg) return "";
  
  const lText = relativeLuminance(rgbText[0], rgbText[1], rgbText[2]);
  const lBg = relativeLuminance(rgbBg[0], rgbBg[1], rgbBg[2]);
  
  if (lText < lBg) {
    return "Try making the text color darker or background color lighter.";
  } else {
    return "Try making the text color lighter or background color darker.";
  }
}
