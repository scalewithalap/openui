---
name: canvas-rendering
description: Instructions for rendering new visual shapes, manipulating the interactive canvas, wiring the minimap, using snap grids, and managing live token injection into iframes. Use when adding new shape tools, modifying selection states, or dealing with sourceFrameId grouping.
---

# Canvas Rendering Guidelines

The canvas in OpenUI (`components/canvas/`) renders absolute-positioned items within a pan/zoom viewport.

## When to Use This Skill
- You need to add a new shape type to the canvas.
- You are modifying `components/canvas/shapes/generatedui/index.tsx`.
- You are working with selection boundaries or the properties toolbar.
- You are modifying the **minimap**, **snap grid**, or **token injection** systems.

## 1. Wiring New Shapes

Every shape on the canvas must:
1. Accept `x`, `y`, `w`, `h` coordinates.
2. Support selection outlines.
3. Be registered in the `Shape` union type in `redux/slice/shapes/index.ts`.

When rendering a shape component, wrap it with `ShapeSelection` if it needs bounding boxes:
```tsx
import ShapeSelection from "../shape-selection";

<ShapeSelection shape={shape} isSelected={isSelected}>
   <div className="absolute inset-0 bg-red-500" />
</ShapeSelection>
```

## 2. The `sourceFrameId` Sibling Pattern

Generated UI frames are often clustered as variants of a single parent. To group variants together, OpenUI uses the `sourceFrameId` field.

- `shape.id`: The unique identifier for this specific variant.
- `shape.sourceFrameId`: The parent ID. If this is a child variant, it points to the parent.

When finding sibling variants:
```typescript
const siblingVariantIds = React.useMemo(() => {
  if (!shape.sourceFrameId) return [];
  return (Object.values(allShapesEntities) as (Shape | undefined)[])
    .filter((s): s is GeneratedUIShape => 
       s != null && 
       s.type === "generatedui" && 
       s.sourceFrameId === shape.sourceFrameId
    )
    .map((s) => s.id);
}, [allShapesEntities, shape.sourceFrameId]);
```

## 3. Sandboxed Iframes & Live Token Injection

The AI outputs HTML/Tailwind strings which are rendered inside sandboxed iframes.

### Iframe Setup Requirements
Every generated-UI iframe MUST:
1. Have `data-openui-shape={shape.id}` attribute — used by the `useTokenInjection()` broadcaster.
2. Include `TOKEN_LISTENER_SCRIPT` in its `srcDoc` — enables receiving CSS variable updates via `postMessage`.
3. Use `sandbox="allow-scripts allow-same-origin"` to allow the parent page to capture screenshots and exports.

```tsx
import { TOKEN_LISTENER_SCRIPT } from "@/hooks/use-token-injection";

// In srcDoc template string:
const srcDoc = `<html><body>
  ${htmlContent}
  ${TOKEN_LISTENER_SCRIPT}
</body></html>`;

// On the iframe element:
<iframe
  data-openui-shape={shape.id}
  sandbox="allow-scripts allow-same-origin"
  srcDoc={srcDoc}
/>
```

### How Token Injection Works
1. `useTokenInjection()` hook is called once at the canvas root (`components/canvas/index.tsx`).
2. When design tokens change, it builds CSS variables via `buildCSSVarsFromGuide(guide)`.
3. It finds all iframes with `data-openui-shape` attribute and sends them a `postMessage`.
4. The `TOKEN_LISTENER_SCRIPT` inside each iframe receives the message and applies CSS custom properties to `document.documentElement`.

## 4. Token Sync Tracking

Each `GeneratedUIShape` has an optional `tokenHash?: string` field:
- Set when a shape is generated or rethemed.
- Compared against `computeTokenHash(guide)` to show sync status.
- The swatch strip at the bottom of each shape shows ✓ (synced) or ⚠ (tokens changed).

## 5. Canvas Minimap

The minimap (`components/canvas/minimap.tsx`) is a fixed bottom-right overlay:
- Renders all shapes as proportional colored SVG rectangles.
- Shows the current viewport as a blue semi-transparent rectangle.
- Supports click-to-navigate (converts minimap coords → world coords → dispatches `setTranslate`).
- Color-coded by shape type: `generatedui=#db2800`, `frame=#3b82f6`, `rect=#8b5cf6`, etc.

## 6. Snap Grid & Alignment Guides

The `useSnapGrid()` hook in `hooks/use-snap-grid.ts` provides:
- **Grid snapping**: Snap positions to 20/40/60px intervals.
- **Alignment guides**: Detect edge/center alignment with other shapes within a 6px threshold.
- De-duplicated `AlignmentGuide[]` array for rendering overlays.

```typescript
const { snapEnabled, toggleSnap, snapPosition, guides, clearGuides } = useSnapGrid();

// During drag:
const snapped = snapPosition(draggedShapeId, newX, newY, shapeW, shapeH);
// Render guides from `guides` state as colored lines
```
