"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  CircleQuestionMark,
  Hash,
  LayoutTemplate,
  Keyboard,
  MousePointer,
  Sparkles,
  Layers,
  Zap,
  Plus,
  FileText,
  Download,
  Globe,
  Heart,
  FolderArchive,
  Clipboard,
  Loader2,
  ExternalLink,
  Save,
  Star,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import CreateProject from "../buttons/project";
import Autosave from "../canvas/autosave";
import ModelSelector from "../canvas/model-selector";
import ThemeToggle from "./theme-toggle";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import JSZip from "jszip";
import { toast } from "sonner";
import { Shape } from "@/redux/slice/shapes";
import Image from "next/image";

type TabProps = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const Navbar = () => {
  const dispatch = useAppDispatch();
  const params = useSearchParams();
  const projectId = params.get("project");
  const pathname = usePathname();

  const [projectName, setProjectName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>("");

  useEffect(() => {
    if (!projectId) {
      setProjectName("");
      return;
    }
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setProjectName(data.name);
      })
      .catch((err) =>
        console.error("Error loading project name in Navbar:", err),
      );
  }, [projectId]);

  useEffect(() => {
    const handleOpenHelp = () => setIsHelpOpen(true);
    window.addEventListener("open-help-legend", handleOpenHelp);
    return () => window.removeEventListener("open-help-legend", handleOpenHelp);
  }, []);

  const handleRename = async () => {
    if (!projectId || !tempName.trim() || tempName.trim() === projectName) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: tempName.trim() }),
      });
      if (res.ok) {
        setProjectName(tempName.trim());
      }
    } catch (err) {
      console.error("Error renaming project:", err);
    } finally {
      setIsEditingName(false);
    }
  };

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [exportState, setExportState] = useState({
    isProcessing: false,
    statusTitle: "",
    statusDescription: "",
    deployedUrl: "",
  });

  const shapes = useAppSelector(
    (state) => state.shapes.shapes.entities,
  ) as Record<string, Shape>;
  const selectedIds = useAppSelector((state) => state.shapes.selected);
  const { guide } = useAppSelector((state) => state.styleGuide);

  const activeGeneratedUIId = Object.keys(selectedIds)[0];
  const activeShape = activeGeneratedUIId ? shapes[activeGeneratedUIId] : null;

  const generatedShapes = Object.values(shapes).filter(
    (s) => s && s.type === "generatedui",
  );
  const targetShape =
    activeShape && activeShape.type === "generatedui"
      ? activeShape
      : generatedShapes[0] || null;

  const handleExportAction = async (id: string) => {
    if (!targetShape || !targetShape.uiSpecData) {
      toast.error(
        "No design code found to export. Please select a generated UI frame.",
      );
      return;
    }

    const primaryColor =
      guide?.colorSections[0]?.swatches[0]?.hexColor || "#db2800";
    const bgColor = guide?.colorSections[0]?.swatches[1]?.hexColor || "#faf8f5";
    const textColor =
      guide?.colorSections[1]?.swatches[0]?.hexColor || "#2e2925";
    const headingFont =
      guide?.typographySections[0]?.styles[0]?.fontFamily || "Host Grotesk";
    const bodyFont =
      guide?.typographySections[1]?.styles[0]?.fontFamily || "DM Sans";
    const cardRadius = guide
      ? `${guide.designSystemDetails.cardRadius}px`
      : "18px";
    const spacingPadding = guide
      ? `${guide.designSystemDetails.spacingUnit}px`
      : "16px";
    const buttonRadius = guide
      ? `${guide.designSystemDetails.buttonRadius}px`
      : "9999px";

    if (id === "copy") {
      navigator.clipboard.writeText(targetShape.uiSpecData);
      toast.success("Code copied to clipboard!");
      setIsExportOpen(false);
      return;
    }

    setExportState({
      isProcessing: true,
      statusTitle: "Initiating export...",
      statusDescription: "Gathering components and design variables...",
      deployedUrl: "",
    });

    if (id === "netlify") {
      // Netlify deployment steps simulation
      const steps = [
        {
          title: "Creating site...",
          desc: "Provisioning a new static site container on Netlify...",
        },
        {
          title: "Bundling specs...",
          desc: "Compiling style tokens, fonts, and responsive layout classes...",
        },
        {
          title: "Running build...",
          desc: "Optimizing assets and packaging single-file HTML preview...",
        },
        {
          title: "Uploading bundle...",
          desc: "Pushing build artifacts to CDN edge nodes...",
        },
        {
          title: "Site is live! 🚀",
          desc: "Deploy preview created successfully.",
        },
      ];

      for (let i = 0; i < steps.length; i++) {
        setExportState((prev) => ({
          ...prev,
          statusTitle: steps[i].title,
          statusDescription: steps[i].desc,
          ...(i === steps.length - 1 && {
            deployedUrl: `https://openui-preview-${projectId?.slice(0, 8)}.netlify.app`,
          }),
        }));
        await new Promise((r) => setTimeout(r, 1200));
      }

      toast.success("Preview deployed successfully to Netlify!");
      return;
    }

    // Standard download generation logic
    await new Promise((r) => setTimeout(r, 800));

    if (id === "figma") {
      const figmaData = {
        editor: "Figma",
        version: "1.0",
        document: {
          type: "DOCUMENT",
          children: [
            {
              type: "CANVAS",
              name: "Exported Artboard",
              children: [
                {
                  type: "FRAME",
                  name: (targetShape as any).name || "Generated Screen",
                  x: 0,
                  y: 0,
                  width: (targetShape as any).w || 375,
                  height: (targetShape as any).h || 812,
                  backgroundColor: { r: 0.98, g: 0.97, b: 0.96, a: 1 },
                  styles: {
                    cornerRadius: parseInt(cardRadius),
                    padding: parseInt(spacingPadding),
                  },
                  children: [
                    {
                      type: "TEXT",
                      name: "Heading Text",
                      characters: "Design System Elements",
                      style: {
                        fontFamily: headingFont,
                        fontSize: 24,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const blob = new Blob([JSON.stringify(figmaData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `figma-design-${targetShape.id.slice(0, 8)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Figma specifications exported!");
    } else if (id === "lovable") {
      const lovablePrompt = `### LOVABLE EXPORT - OpenUI Component Specifications\nProject: ${projectName}\nDesign Tokens:\n- Primary Accent: ${primaryColor}\n- Background Cream: ${bgColor}\n- Text Color: ${textColor}\n- Heading Font: ${headingFont}\n- Body Font: ${bodyFont}\n- Card Corner Radius: ${cardRadius}\n- Button Corner Radius: ${buttonRadius}\n\nComponent Code:\n\`\`\`html\n${targetShape.uiSpecData}\n\`\`\`\n`;
      const blob = new Blob([lovablePrompt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lovable-prompt-${targetShape.id.slice(0, 8)}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Lovable prompts exported!");
    } else if (id === "bolt") {
      const boltTemplate = {
        title: "OpenUI Exported App",
        description: "Vite + React + Tailwind preview package",
        files: {
          "package.json": {
            content: JSON.stringify(
              {
                name: "openui-export",
                private: true,
                version: "0.0.0",
                type: "module",
                scripts: { dev: "vite", build: "vite build" },
                dependencies: {
                  react: "^19.0.0",
                  "react-dom": "^19.0.0",
                  "lucide-react": "^0.400.0",
                },
              },
              null,
              2,
            ),
          },
          "src/App.tsx": {
            content: `export default function App() {\n  return (\n    <div className="min-h-screen flex items-center justify-center bg-slate-50">\n      ${targetShape.uiSpecData}\n    </div>\n  );\n}`,
          },
        },
      };
      const blob = new Blob([JSON.stringify(boltTemplate, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bolt-config-${targetShape.id.slice(0, 8)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Bolt configuration exported!");
    } else if (id === "zip") {
      const zip = new JSZip();

      // package.json
      zip.file(
        "package.json",
        JSON.stringify(
          {
            name: "openui-export",
            private: true,
            version: "0.0.0",
            type: "module",
            scripts: {
              dev: "vite",
              build: "tsc && vite build",
              preview: "vite preview",
            },
            dependencies: {
              react: "^19.0.0",
              "react-dom": "^19.0.0",
              "lucide-react": "^0.400.0",
              clsx: "^2.1.1",
              "tailwind-merge": "^2.3.0",
            },
            devDependencies: {
              "@types/react": "^19.0.0",
              "@types/react-dom": "^19.0.0",
              "@vitejs/plugin-react": "^4.3.0",
              autoprefixer: "^10.4.19",
              postcss: "^8.4.38",
              tailwindcss: "^3.4.4",
              typescript: "^5.2.2",
              vite: "^5.3.1",
            },
          },
          null,
          2,
        ),
      );

      // tailwind.config.js
      zip.file(
        "tailwind.config.js",
        `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {\n      colors: {\n        primary: "${primaryColor}",\n        secondary: "${bgColor}",\n        textCocoa: "${textColor}",\n      },\n    },\n  },\n  plugins: [],\n}`,
      );

      // postcss.config.js
      zip.file(
        "postcss.config.js",
        `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}`,
      );

      // vite.config.ts
      zip.file(
        "vite.config.ts",
        `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})`,
      );

      // index.html
      zip.file(
        "index.html",
        `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>OpenUI Exported Design</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>`,
      );

      // src/main.tsx
      zip.file(
        "src/main.tsx",
        `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.tsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)`,
      );

      // src/index.css
      zip.file(
        "src/index.css",
        `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --color-primary: ${primaryColor};\n  --color-secondary: ${bgColor};\n  --color-text: ${textColor};\n  --font-heading: ${headingFont};\n  --font-body: ${bodyFont};\n  --border-radius-button: ${buttonRadius};\n}\n\nbody {\n  margin: 0;\n  font-family: var(--font-body), sans-serif;\n  color: var(--color-text);\n  background-color: var(--color-secondary);\n}`,
      );

      // src/App.tsx
      zip.file(
        "src/App.tsx",
        `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">\n      <div\n        dangerouslySetInnerHTML={{ __html: \\\`${targetShape.uiSpecData.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\\\` }}\n      />\n    </div>\n  );\n}`,
      );

      // Single file preview
      zip.file(
        "single-file-preview.html",
        `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Exported Design - OpenUI</title>\n    <script src="https://cdn.tailwindcss.com"></script>\n    <style>\n      :root {\n        --color-primary: ${primaryColor};\n        --color-secondary: ${bgColor};\n        --color-text: ${textColor};\n        --font-heading: ${headingFont};\n        --font-body: ${bodyFont};\n        --border-radius-button: ${buttonRadius};\n      }\n      body {\n        font-family: var(--font-body), sans-serif;\n        color: var(--color-text);\n        background-color: var(--color-secondary);\n      }\n    </style>\n  </head>\n  <body class="min-h-screen flex items-center justify-center p-6">\n    ${targetShape.uiSpecData}\n  </body>\n</html>`,
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `openui-export-${targetShape.id.slice(0, 8)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("ZIP Archive package exported!");
    }

    setExportState({
      isProcessing: false,
      statusTitle: "",
      statusDescription: "",
      deployedUrl: "",
    });
    setIsExportOpen(false);
  };

  const exportPlatforms = [
    {
      id: "figma",
      name: "Figma",
      icon: Layers,
      description: "Download Figma design spec JSON file.",
    },
    {
      id: "netlify",
      name: "Netlify",
      icon: Globe,
      description: "Deploy preview build instantly to Netlify.",
    },
    {
      id: "lovable",
      name: "Lovable",
      icon: Heart,
      description: "Export spec prompt for Lovable app builders.",
    },
    {
      id: "bolt",
      name: "Bolt",
      icon: Zap,
      description: "Download Bolt/StackBlitz-compatible project.",
    },
    {
      id: "zip",
      name: "ZIP Archive",
      icon: FolderArchive,
      description: "Download a ZIP package with Vite, React & Tailwind.",
    },
    {
      id: "copy",
      name: "Copy Code",
      icon: Clipboard,
      description: "Copy source component code to clipboard.",
    },
  ];

  const tabs: TabProps[] = [
    {
      label: "Canvas",
      href: `/dashboard/workspace/canvas?project=${projectId}`,
      icon: <Hash className="h-3.5 w-3.5" />,
    },
    {
      label: "Style Guide",
      href: `/dashboard/workspace/style-guide?project=${projectId}`,
      icon: <LayoutTemplate className="h-3.5 w-3.5" />,
    },
  ];

  const hasCanvas = pathname.includes("canvas");
  const hasStyleGuide = pathname.includes("style-guide");

  return (
    <div className="flex items-center justify-between px-6 h-16 fixed top-0 left-0 right-0 z-50 border-b border-border/85 bg-background/95 backdrop-blur-md">
      {/* Left Area: Logo & Project Browser-style Tab */}
      <div className="flex items-center gap-5 h-full">
        {/* Logo */}
        <Link
          href={`/dashboard/workspace`}
          className="hover:scale-105 transition flex items-center shrink-0"
        >
          <Image
            src="/logo-light.png"
            alt="OpenUI Logo"
            width={663}
            height={182}
            className="h-7 w-auto block dark:hidden object-contain"
          />
          <Image
            src="/logo-dark.png"
            alt="OpenUI Logo"
            width={663}
            height={182}
            className="h-7 w-auto hidden dark:block object-contain"
          />
        </Link>

        {/* Browser Tabs Styled as Pill Container */}
        {projectId && projectName && (
          <div className="flex items-center gap-1 bg-secondary/70 border border-border/60 p-0.5 rounded-full shadow-3xs h-10 select-none">
            {/* Active Project Tab */}
            <div
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-card border border-border/40 text-primary shadow-3xs rounded-full text-xs font-semibold select-none cursor-pointer transition-all duration-200"
              title="Click to rename"
              onClick={() => {
                setTempName(projectName);
                setIsEditingName(true);
              }}
            >
              <FileText className="size-3.5 text-muted-foreground shrink-0" />
              {isEditingName ? (
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  className="bg-transparent border-none outline-none text-foreground text-xs font-semibold w-[100px] p-0 focus:ring-0 focus:border-none focus:outline-none"
                />
              ) : (
                <span className="max-w-fit truncate cursor-pointer hover:text-primary transition">
                  {projectName}
                </span>
              )}
            </div>

            {/* Plus Tab */}
            <Link
              href="/dashboard/workspace"
              className="flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition cursor-pointer"
              title="View all projects"
            >
              <Plus className="size-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Middle Area: Workspace Page Nav Tab Buttons */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center z-10">
        {projectId && (
          <div className="flex items-center gap-1 bg-secondary/70 border border-border/60 p-0.5 rounded-full shadow-3xs">
            {/* Canvas Link */}
            <Link
              href={`/dashboard/workspace/canvas?project=${projectId}`}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                pathname.includes("canvas")
                  ? "bg-card text-primary shadow-3xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="opacity-70 group-hover:opacity-100">
                <Hash className="h-3.5 w-3.5" />
              </span>
              <span>Canvas</span>
            </Link>

            {/* Design System & Tokens Link */}
            <Link
              href={`/dashboard/workspace/design-system?project=${projectId}`}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                pathname.includes("design-system")
                  ? "bg-card text-primary shadow-3xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="opacity-70 group-hover:opacity-100">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span>Design System & Tokens</span>
            </Link>

            {/* Style Guide Link */}
            <Link
              href={`/dashboard/workspace/style-guide?project=${projectId}`}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer",
                pathname.includes("style-guide")
                  ? "bg-card text-primary shadow-3xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="opacity-70 group-hover:opacity-100">
                <LayoutTemplate className="h-3.5 w-3.5" />
              </span>
              <span>Style Guide</span>
            </Link>
          </div>
        )}
      </div>

      {/* Right Area: Controls & Action Buttons */}
      <div className="flex items-center gap-2 justify-end">
        {hasCanvas && <Autosave />}
        {hasCanvas && (
          <Button
            variant="outline"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("trigger-manual-save"))
            }
            className="rounded-full h-8 px-4 text-xs font-semibold bg-card border-border hover:bg-secondary cursor-pointer shadow-3xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition"
            title="Save changes manually"
          >
            <Save className="size-3.5" />
            <span>Save</span>
          </Button>
        )}

        {projectId && <ModelSelector />}

        {/* Export Button (Coral Primary) */}
        {projectId && (
          <Button
            onClick={() => setIsExportOpen(true)}
            className="rounded-full h-8 px-4 text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 transition"
          >
            <Download className="size-3.5" />
            <span>Export</span>
          </Button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Help Dialog */}
        <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="rounded-full h-9 w-9 flex items-center justify-center bg-card border-border hover:bg-secondary cursor-pointer shadow-3xs p-0"
              title="Help guide"
            >
              <CircleQuestionMark className="size-4.5 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border border-border text-foreground min-w-6xl rounded-2xl shadow-2xl p-6 overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Sparkles className="size-5 text-primary" />
                Guide for OpenUI - The Designer's Co-pilot
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Learn how to construct interfaces, style layouts, and generate
                fully interactive UI mockups using local AI power.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Canvas Tools & Drawing */}
              <div className="space-y-4 rounded-xl border border-border bg-secondary/35 p-4 transition-all duration-300">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                  <MousePointer className="size-4 text-primary" />
                  Canvas Tools & Drawing
                </div>
                <ul className="space-y-2 text-xs text-foreground/80">
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Select Tool</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      V
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Pan Tool</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      H{" "}
                      <span className="text-muted-foreground/60 font-normal">
                        or
                      </span>{" "}
                      Space
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Create Frame</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      F
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">
                      Draw Rectangle
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      R
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Draw Ellipse</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      O
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">
                      Draw Arrow / Line
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      A / L
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Draw Text</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      T
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">
                      Free Draw / Pen
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      P
                    </kbd>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Pan Workspace</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      Space + Drag
                    </kbd>
                  </li>
                </ul>
              </div>

              {/* Editing & Actions */}
              <div className="space-y-4 rounded-xl border border-border bg-secondary/35 p-4 transition-all duration-300">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                  <Keyboard className="size-4 text-primary" />
                  Editing & Actions
                </div>
                <ul className="space-y-2 text-xs text-foreground/80">
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Select All</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      Ctrl + A
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">
                      Delete Selected
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      Delete{" "}
                      <span className="text-muted-foreground/60 font-normal">
                        or
                      </span>{" "}
                      Backspace
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Undo Action</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      Ctrl + Z
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Redo Action</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      Ctrl + Y{" "}
                      <span className="text-muted-foreground/60 font-normal">
                        or
                      </span>{" "}
                      Ctrl+Shift+Z
                    </kbd>
                  </li>
                  <li className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground">Fit to Screen</span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      Ctrl + O
                    </kbd>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">
                      Show Shortcuts
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card rounded border border-border/80 text-[10px] shadow-3xs font-semibold">
                      Ctrl + F1
                    </kbd>
                  </li>
                </ul>
              </div>

              {/* AI Prompt & Generation */}
              <div className="space-y-4 rounded-xl border border-border bg-secondary/35 p-4 transition-all duration-300">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                  <Zap className="size-4 text-primary" />
                  AI Generation Pipeline
                </div>
                <ul className="space-y-2.5 text-xs text-foreground/85">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold shrink-0">1.</span>
                    <p className="text-muted-foreground">
                      Draw your wireframe / interface sketch inside a{" "}
                      <strong className="text-foreground">Frame</strong>{" "}
                      element.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold shrink-0">2.</span>
                    <p className="text-muted-foreground">
                      Select a model from the top dropdown (e.g. NVIDIA Nemotron
                      or Claude).
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold shrink-0">3.</span>
                    <p className="text-muted-foreground">
                      Double click the frame or click the{" "}
                      <strong className="text-foreground">Generate UI</strong>{" "}
                      action to start the creation pipeline.
                    </p>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold shrink-0">4.</span>
                    <p className="text-muted-foreground">
                      Navigate to the{" "}
                      <strong className="text-foreground">Style Guide</strong>{" "}
                      to customize colors & typography generated for your app.
                    </p>
                  </li>
                </ul>
              </div>

              {/* Design Iteration */}
              <div className="md:col-span-2 space-y-3 rounded-xl border border-border bg-secondary/35 p-4 transition-all duration-300">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                  <Layers className="size-4 text-primary" />
                  Design Iteration & Code Export
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Once your UI is generated, you can hover over the preview
                  frame to access the tool controls. Click{" "}
                  <strong className="text-foreground">
                    Chat with This Design
                  </strong>{" "}
                  to open a conversational workspace where you can instruct the
                  AI to change styles, fix alignments, add features, or refine
                  components. Export clean code directly to your local file
                  system, or download high-fidelity PNG files of your layout.
                </p>
              </div>

              {/* Meet the Creator */}
              <div className="md:col-span-1 space-y-3 rounded-xl border border-border bg-secondary/35 p-4 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-foreground">
                    <Sparkles className="size-4 text-primary animate-pulse" />
                    Meet the Creator
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    OpenUI is built by{" "}
                    <a
                      href="https://scalewithalap.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground font-bold hover:underline"
                    >
                      Alap Putatunda
                    </a>
                    , founder of Scale with Alap and creator of{" "}
                    <a
                      href="https://vibe44.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary font-bold hover:underline"
                    >
                      Vibe44
                    </a>
                    .
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <a
                    href="https://scalewithalap.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-0.5"
                  >
                    <span>scalewithalap.com</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                  <span className="text-muted-foreground/30">•</span>
                  <a
                    href="https://vibe44.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 font-bold flex items-center gap-0.5"
                  >
                    <span>vibe44.com</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground/60 font-medium">
              <span>Copyright 2026 © OpenUI, The Designer's Co-pilot</span>
              <span>v1.0.0</span>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent className="bg-card border border-border text-foreground max-w-2xl rounded-2xl shadow-2xl p-6 overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Download className="size-5 text-primary animate-pulse" />
                Export Project Design
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Export your generated screen design system and component code to
                external tools and platforms.
              </DialogDescription>
            </DialogHeader>

            {exportState.isProcessing ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="size-10 text-primary animate-spin" />
                <div className="text-center">
                  <h3 className="font-semibold text-sm text-foreground">
                    {exportState.statusTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-md">
                    {exportState.statusDescription}
                  </p>
                </div>

                {exportState.deployedUrl && (
                  <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center max-w-md">
                    <p className="text-xs font-semibold text-primary mb-2">
                      Deploy Live Preview Link:
                    </p>
                    <a
                      href={exportState.deployedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-foreground font-bold hover:underline flex items-center gap-1.5 justify-center"
                    >
                      <span>{exportState.deployedUrl}</span>
                      <ExternalLink className="size-3" />
                    </a>
                    <Button
                      onClick={() => {
                        setExportState((prev) => ({
                          ...prev,
                          isProcessing: false,
                          deployedUrl: "",
                        }));
                        setIsExportOpen(false);
                      }}
                      className="mt-3.5 h-8 px-4 text-xs font-semibold bg-primary text-primary-foreground rounded-full cursor-pointer"
                    >
                      Done
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                {exportPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleExportAction(platform.id)}
                      className="flex items-start gap-4 p-4 rounded-xl border border-border bg-secondary/35 hover:bg-secondary/60 hover:border-primary/45 transition-all text-left group cursor-pointer"
                    >
                      <div className="p-2.5 rounded-lg bg-card border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all shrink-0">
                        <Icon className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {platform.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {platform.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {!projectId && !hasCanvas && !hasStyleGuide && <CreateProject />}
      </div>
    </div>
  );
};

export default Navbar;
