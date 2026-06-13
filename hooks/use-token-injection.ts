"use client";
import { useEffect, useCallback, useRef } from "react";
import { useAppSelector } from "@/redux/store";
import type { ExtendedStyleGuide } from "@/redux/slice/style-guide";

/**
 * Builds a flat Record<string, string> of CSS custom properties from the current style guide.
 * These are injected into iframes via postMessage so generated UI previews
 * update in real time as the user edits design tokens.
 */
export function buildCSSVarsFromGuide(guide: ExtendedStyleGuide): Record<string, string> {
  const vars: Record<string, string> = {};

  // -- Core color tokens (resolved dynamically from sections) --
  const primarySection = guide.colorSections.find(s => s.title === "Primary Colors");
  const secondarySection = guide.colorSections.find(s => s.title === "Secondary & Accent Colors");
  const statusSection = guide.colorSections.find(s => s.title === "Status & Feedback Colors");
  const uiSection = guide.colorSections.find(s => s.title === "UI Component Colors");

  vars["--color-primary"] = primarySection?.swatches[0]?.hexColor || "#db2800";
  vars["--color-secondary"] = primarySection?.swatches[1]?.hexColor || "#faf8f5";
  vars["--color-text"] = secondarySection?.swatches[0]?.hexColor || "#2e2925";
  vars["--color-accent"] = secondarySection?.swatches[1]?.hexColor || "#8a9a86";

  // Semantic / status colors
  vars["--color-success"] = statusSection?.swatches.find(s => s.name === "Success")?.hexColor || "#10B981";
  vars["--color-warning"] = statusSection?.swatches.find(s => s.name === "Warning")?.hexColor || "#F59E0B";
  vars["--color-error"] = statusSection?.swatches.find(s => s.name === "Error")?.hexColor || "#EF4444";
  vars["--color-info"] = statusSection?.swatches.find(s => s.name === "Info")?.hexColor || "#3B82F6";

  // UI component colors
  vars["--color-surface-variant"] = uiSection?.swatches.find(s => s.name === "Surface Variant")?.hexColor || "#ffffff";
  vars["--color-muted"] = uiSection?.swatches.find(s => s.name === "Muted Background")?.hexColor || "#f4f4f5";
  vars["--color-border"] = uiSection?.swatches.find(s => s.name === "Border Color")?.hexColor || "#e4e4e7";

  // -- Typography tokens --
  const headingFont = guide.typographySections[0]?.styles[0]?.fontFamily || "Host Grotesk";
  const bodyFont = guide.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";
  vars["--font-heading"] = `'${headingFont}', sans-serif`;
  vars["--font-body"] = `'${bodyFont}', sans-serif`;

  // -- Layout tokens --
  vars["--border-radius-card"] = `${guide.designSystemDetails.cardRadius}px`;
  vars["--border-radius-button"] = `${guide.designSystemDetails.buttonRadius}px`;
  vars["--spacing-unit"] = `${guide.designSystemDetails.spacingUnit}px`;

  return vars;
}

/**
 * Creates a lightweight hash string from the guide's key token values.
 * Used to detect when tokens have changed since a shape was generated.
 */
export function computeTokenHash(guide: ExtendedStyleGuide): string {
  const parts: string[] = [];

  // Include all color swatches
  for (const section of guide.colorSections) {
    for (const swatch of section.swatches) {
      parts.push(swatch.hexColor);
    }
  }

  // Include font families
  for (const section of guide.typographySections) {
    for (const style of section.styles) {
      parts.push(style.fontFamily);
    }
  }

  // Include layout values
  parts.push(String(guide.designSystemDetails.cardRadius));
  parts.push(String(guide.designSystemDetails.buttonRadius));
  parts.push(String(guide.designSystemDetails.spacingUnit));

  // Simple hash (djb2)
  let hash = 5381;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * The inline script injected into generated-UI iframes so they can
 * receive live token updates from the parent window.
 */
export const TOKEN_LISTENER_SCRIPT = `
<script>
  window.addEventListener('message', function(event) {
    // Only accept token updates from same origin or srcDoc origin ("null")
    if (event.origin !== window.location.origin && event.origin !== 'null') return;
    if (event.data && event.data.type === 'openui-token-update' && event.data.cssVars) {
      var root = document.documentElement;
      var vars = event.data.cssVars;
      for (var key in vars) {
        if (vars.hasOwnProperty(key)) {
          root.style.setProperty(key, vars[key]);
        }
      }
    }
  });
<\/script>`;

/**
 * Hook that watches the style guide state and broadcasts CSS variable
 * updates to all active generated-UI iframes via postMessage.
 *
 * Usage: Call once at the canvas root level.
 */
export function useTokenInjection() {
  const guide = useAppSelector((state) => state.styleGuide.guide);
  const prevVarsRef = useRef<string>("");

  const broadcast = useCallback(() => {
    if (!guide) return;

    const cssVars = buildCSSVarsFromGuide(guide);
    const serialized = JSON.stringify(cssVars);

    // Skip broadcasting if nothing changed
    if (serialized === prevVarsRef.current) return;
    prevVarsRef.current = serialized;

    // Find all iframes tagged with data-openui-shape
    const iframes = document.querySelectorAll<HTMLIFrameElement>("iframe[data-openui-shape]");
    iframes.forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(
          { type: "openui-token-update", cssVars },
          window.location.origin
        );
      } catch {
        // Cross-origin or destroyed iframe — silently skip
      }
    });
  }, [guide]);

  useEffect(() => {
    broadcast();
  }, [broadcast]);
}
