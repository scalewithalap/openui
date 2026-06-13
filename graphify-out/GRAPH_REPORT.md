# Graph Report - openui  (2026-06-13)

## Corpus Check
- 163 files · ~173,758 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 526 nodes · 499 edges · 18 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]

## God Nodes (most connected - your core abstractions)
1. `getFallbackModel()` - 12 edges
2. `useAppDispatch()` - 12 edges
3. `getLanguageModel()` - 11 edges
4. `GET()` - 9 edges
5. `getVisionLanguageModel()` - 7 edges
6. `createStreamResponse()` - 7 edges
7. `POST()` - 6 edges
8. `POST()` - 6 edges
9. `downloadBlob()` - 6 edges
10. `getShapeRect()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `useMoodBoard()`  [INFERRED]
  app\api\uploads\[...path]\route.ts → hooks\use-styles.ts
- `DesignSystemPage()` --calls--> `useAppDispatch()`  [INFERRED]
  app\(protected)\dashboard\[session]\(workspace)\design-system\page.tsx → redux\store.ts
- `POST()` --calls--> `GET()`  [INFERRED]
  app\api\generate\route.ts → app\api\uploads\[...path]\route.ts
- `POST()` --calls--> `Text()`  [INFERRED]
  app\api\generate\convert\route.ts → components\canvas\shapes\text\index.tsx
- `POST()` --calls--> `updateProjectStyleGuide()`  [INFERRED]
  app\api\generate\style\route.ts → lib\db\projects.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (22): Page(), getMoodBoardImages(), createProject(), deleteProject(), getAllProjects(), getProject(), getProjectStyleGuide(), renameProject() (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (15): Autosave(), addInspirationImage(), addMoodBoardImage(), ensureDir(), removeInspirationImage(), removeMoodBoardImage(), DesignSystemPage(), handleConvertCode() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (17): useChatWindow(), useFrame(), useGlobalChat(), useInfiniteCanvas(), useWorkflowGeneration(), useProjectCreation(), useGeneratedContainer(), useMoodBoard() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (17): getFallbackModel(), getLanguageModel(), getVisionLanguageModel(), isVisionModel(), parseModelString(), createStreamResponse(), ProjectNotFoundError, resolveModelForProject() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (15): Ellipse(), handleDownload(), buildGoogleFontsUrl(), downloadBlob(), downloadHTML(), exportGeneratedUIAsPNG(), generateFrameSnapshot(), getShapesInsideFrame() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (10): getShapeBounds(), Connector(), getTextWidth(), boundsFromPoints(), calculateArrowHead(), getBestConnectionPoints(), getShapeCenter(), getShapeRect() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.2
Nodes (4): handleExportDesignMd(), generateMarkdownFromGuide(), parseMarkdownToGuide(), parseYAML()

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (2): formatModelName(), getDisplayName()

### Community 13 - "Community 13"
Cohesion: 0.36
Nodes (4): getMainShape(), getShapeCenter(), handleCommit(), handleKeyDown()

### Community 14 - "Community 14"
Cohesion: 0.39
Nodes (5): colorDistance(), extractDominantColors(), kMeans(), samplePixels(), sortByVibrancy()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 18 - "Community 18"
Cohesion: 0.62
Nodes (6): checkContrast(), contrastRatio(), getContrastRecommendation(), getWCAGLevel(), hexToRgb(), relativeLuminance()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (2): screenToWorld(), zoomAroundScreenPoint()

### Community 20 - "Community 20"
Cohesion: 0.4
Nodes (4): getProjectSettings(), updateProjectSettings(), GET(), POST()

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 28 - "Community 28"
Cohesion: 0.6
Nodes (3): fetchAllModels(), getEnabledProviders(), GET()

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (2): Arrow(), calculateArrowHead()

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (2): ArrowPreview(), calculateArrowHead()

## Knowledge Gaps
- **Thin community `Community 12`** (8 nodes): `formatModelName()`, `getDisplayName()`, `getSortedModels()`, `handleBlur()`, `handleClickOutside()`, `handleSelect()`, `load()`, `model-selector.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (7 nodes): `index.ts`, `clamp()`, `distance()`, `midpoint()`, `screenToWorld()`, `worldToScreen()`, `zoomAroundScreenPoint()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (5 nodes): `carousel.tsx`, `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (3 nodes): `Arrow()`, `calculateArrowHead()`, `index.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (3 nodes): `ArrowPreview()`, `calculateArrowHead()`, `preview.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 1` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `deleteProject()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `DELETE()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `getFallbackModel()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`getFallbackModel()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `useAppDispatch()` (e.g. with `DesignSystemPage()` and `Note()`) actually correct?**
  _`useAppDispatch()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `getLanguageModel()` (e.g. with `POST()` and `POST()`) actually correct?**
  _`getLanguageModel()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `GET()` (e.g. with `DesignSystemPage()` and `POST()`) actually correct?**
  _`GET()` has 8 INFERRED edges - model-reasoned connections that need verification._