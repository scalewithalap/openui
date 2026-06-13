---
name: redux-state-management
description: Guides agents on safely modifying OpenUI's Redux Toolkit slices, resolving TypeScript typing errors for EntityState, managing canvas history via pushPast, working with the style guide snapshot system, and using the token hash sync tracking. Use when editing shapes, selection states, adding new canvas tools, or modifying design token state.
---

# Redux State Management in OpenUI

OpenUI uses Redux Toolkit with `createEntityAdapter` to manage complex interactive canvas data. This skill defines the strict patterns for safely updating the state without breaking TypeScript constraints.

## When to Use This Skill
- You are updating or adding new reducers in `redux/slice/shapes/index.ts`.
- You are accessing `state.shapes.shapes.entities` inside functional components.
- You are adding Undo/Redo history support to a new action.
- You are modifying the **style guide slice** (`redux/slice/style-guide.ts`), including snapshots, visual tokens, or markdown sync.

## 1. Type Casting EntityState Dictionaries (CRITICAL)

When you map or filter over `state.shapes.shapes.entities`, TypeScript will incorrectly infer the object values as `{}` or `unknown` because of Redux Toolkit's generic dictionary mapping `[id: string]: T | undefined`.

### ❌ Incorrect Pattern
```typescript
const shapes = Object.values(allShapesEntities).filter(s => s.type === "generatedui");
// TypeScript Error: Property 'type' does not exist on type '{}'
```

### ✅ Correct Pattern
Always cast the dictionary values to an array of `Shape | undefined` before filtering:
```typescript
import { Shape, GeneratedUIShape } from "@/redux/slice/shapes";

const shapes = (Object.values(allShapesEntities) as (Shape | undefined)[])
  .filter((s): s is GeneratedUIShape => s != null && s.type === "generatedui");
```

## 2. Managing Canvas History (`pushPast`)

OpenUI implements a custom undo/redo engine. Any Redux reducer that *modifies* the canvas (adds, deletes, or alters a shape's core data) **MUST** capture the previous state first.

Before modifying `state.shapes` in a reducer, call the internal `pushPast(state)` helper:

```typescript
addGeneratedUI(state, action: PayloadAction<...>) {
  // 1. Save history snapshot
  pushPast(state); 
  
  // 2. Perform mutation
  shapesAdapter.addOne(state.shapes, makeGeneratedUI(action.payload));
}
```

## 3. The `GeneratedUIShape` Interface

```typescript
interface GeneratedUIShape extends BaseShape {
  type: "generatedui";
  x: number; y: number; w: number; h: number;
  uiSpecData: string | null;     // The generated HTML content
  sourceFrameId: string;          // Parent frame for variant grouping
  isWorkflowPage?: boolean;       // Flag for workflow pages
  tokenHash?: string;             // Hash of design tokens at generation time
}
```

The `tokenHash` field is set by `computeTokenHash(guide)` from `hooks/use-token-injection.ts` and is used to detect whether a shape's visuals are in sync with the current design tokens.

## 4. Style Guide State Structure

```typescript
interface StyleGuideState {
  guide: ExtendedStyleGuide | null;
  mode: EditorMode;               // "visual" | "markdown" | "split"
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  isTokensEditorOpen: boolean;
  snapshots: StyleGuideSnapshot[];  // Version history (max 20)
  maxSnapshots: number;
}
```

### Key Reducers
| Reducer | Purpose |
|---------|---------|
| `loadStyleGuideSuccess(guide)` | Loads a complete style guide into state |
| `updateVisualTokens(patch)` | Updates individual tokens (colors, fonts, radii) |
| `updateMarkdownText(md)` | Updates the raw DESIGN.md text |
| `syncMarkdownToTokens()` | Parses DESIGN.md YAML → updates visual tokens |
| `saveSnapshot(name)` | Captures current guide as a named snapshot |
| `restoreSnapshot(id)` | Restores a previous snapshot |
| `deleteSnapshot(id)` | Removes a snapshot |

### Snapshot Deep Clone Pattern
Snapshots use `JSON.parse(JSON.stringify(state.guide))` to prevent Redux reference sharing. This is intentional — Immer's draft proxies would otherwise create cross-reference issues.

## 5. Disallowed Operations
- **Do not** write custom ID generation in reducers; use `nanoid()` inside the `makeX()` factory functions.
- **Do not** mutate `state.selected` without accounting for history if the selection is structurally important.
- **Do not** hardcode values in `DesignSystemDetails` — all values must be computed from the dynamic `colorSections` and `typographySections` arrays.
- **Do not** add new state fields to the style guide without updating the `ExtendedStyleGuide` interface AND the `parseMarkdownToGuide` / `generateMarkdownFromGuide` bidirectional sync functions.
