"use client";
import { useProjectCreation } from "@/hooks/use-project";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { parseHtmlDocument } from "@/lib/html-parser";

const buildPreviewSrcDoc = (project: any) => {
  const guide = project.styleGuide;

  const primaryColor =
    guide?.colorSections?.find((s: any) => s.title === "Primary Colors")
      ?.swatches?.[0]?.hexColor || "#db2800";

  const bgColor =
    guide?.colorSections?.find((s: any) => s.title === "Primary Colors")
      ?.swatches?.[1]?.hexColor || "#faf8f5";

  const textColor =
    guide?.colorSections?.find(
      (s: any) => s.title === "Secondary & Accent Colors",
    )?.swatches?.[0]?.hexColor || "#2e2925";

  const headingFont =
    guide?.typographySections?.find(
      (s: any) =>
        s.title.toLowerCase().includes("heading") ||
        s.title.toLowerCase().includes("headline"),
    )?.styles?.[0]?.fontFamily ||
    guide?.typographySections?.[0]?.styles?.[0]?.fontFamily ||
    "Host Grotesk";

  const bodyFont =
    guide?.typographySections?.find((s: any) =>
      s.title.toLowerCase().includes("body"),
    )?.styles?.[0]?.fontFamily ||
    guide?.typographySections?.[1]?.styles?.[0]?.fontFamily ||
    "DM Sans";

  const buttonRadius = guide
    ? `${guide.designSystemDetails?.buttonRadius || 9999}px`
    : "9999px";
  const fontImportUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(headingFont)}:wght@400;700&family=${encodeURIComponent(bodyFont)}:wght@400;700&display=swap`;

  const parsed = parseHtmlDocument(project.htmlPreview);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="${fontImportUrl}" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    :root {
      --color-primary: ${primaryColor};
      --color-secondary: ${bgColor};
      --color-text: ${textColor};
      --font-heading: '${headingFont}', sans-serif;
      --font-body: '${bodyFont}', sans-serif;
      --border-radius-button: ${buttonRadius};
    }
    body {
      font-family: var(--font-body);
      color: var(--color-text);
      background-color: transparent;
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100%;
      height: 100%;
    }
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }
  </style>
  ${parsed.headContent}
</head>
  <body class="${parsed.bodyClass}" style="${parsed.bodyStyle}; width: 100%; height: 100%; overflow: hidden; background-color: transparent;">
  ${parsed.bodyContent}
</body>
</html>`;
};

const ProjectPreview = ({ project }: { project: any }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = React.useState<number>(300);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCardWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const guide = project.styleGuide;
  const cardBg =
    guide?.colorSections?.find((s: any) => s.title === "UI Component Colors")
      ?.swatches?.[0]?.hexColor || "#ffffff";
  const borderCol =
    guide?.colorSections?.find((s: any) => s.title === "UI Component Colors")
      ?.swatches?.[2]?.hexColor || "#e4e4e7";
  const cardRadius = guide
    ? `${guide.designSystemDetails?.cardRadius || 18}px`
    : "18px";
  const spacingPadding = guide
    ? `${guide.designSystemDetails?.spacingUnit || 15}px`
    : "15px";

  const mockupWidth = project.canvasWidth || (project.isMobile ? 375 : 1024);
  const mockupHeight = project.canvasHeight || (project.isMobile ? 812 : 576);

  const cardHeight = cardWidth * (2 / 3);
  const scaleX = cardWidth / mockupWidth;
  const scaleY = cardHeight / mockupHeight;
  const scale = Math.max(scaleX, scaleY);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden pointer-events-none select-none animate-fade-in"
    >
      <div
        style={{
          width: `${mockupWidth}px`,
          height: `${mockupHeight}px`,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
          position: "absolute",
          top: 0,
          left: "50%",
          borderRadius: cardRadius,
          padding: spacingPadding,
          backgroundColor: cardBg,
          borderColor: borderCol,
          borderWidth: "1px",
          boxShadow:
            "0 12px 48px -12px rgba(46, 41, 37, 0.08), 0 8px 24px -8px rgba(46, 41, 37, 0.04)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "stretch",
          flexShrink: 0,
        }}
      >
        <iframe
          srcDoc={buildPreviewSrcDoc(project)}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            overflow: "hidden",
          }}
          className="bg-transparent pointer-events-none rounded-lg"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

const ProjectsList = () => {
  const { projects, canCreate, deleteProject } = useProjectCreation();
  const [deletingProject, setDeletingProject] = useState<{
    id: string;
    name: string;
  } | null>(null);

  if (!canCreate) {
    return (
      <div className="text-center py-12">
        <p className="text-lg">Please sign-in to view your projects.</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (deletingProject) {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Your Projects
          </h1>
          <p className="text-muted-foreground">
            Manage your design projects and continue where you left off.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24 rounded-2xl border border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-4 rounded-lg bg-muted flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            No projects yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Create your first project to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <Link
              className="group cursor-pointer relative block"
              key={project._id}
              href={`/dashboard/workspace/canvas?project=${project._id}`}
            >
              <div className="space-y-3">
                <div
                  className="relative rounded-lg overflow-hidden aspect-300/200 flex items-center justify-center border border-border/60 shadow-xs"
                  style={{
                    backgroundColor:
                      project.htmlPreview && project.styleGuide
                        ? project.styleGuide.colorSections?.find(
                            (s: any) => s.title === "Primary Colors",
                          )?.swatches?.[1]?.hexColor || "#faf8f5"
                        : undefined,
                  }}
                >
                  {project.htmlPreview ? (
                    <ProjectPreview project={project} />
                  ) : project.thumbnail ? (
                    <>
                      <Image
                        src={project.thumbnail}
                        alt={project.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 30vw, 20vw"
                      />
                      {project.thumbnail.startsWith("data:image/svg+xml") && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative w-[18%] aspect-square rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
                            <Image
                              src="/icon.png"
                              alt="OpenUI Icon"
                              fill
                              sizes="100vw"
                              className="object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 flex items-center
      justify-center"
                    >
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-medium text-foreground text-md truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                    <p
                      className="text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      Last opened{" "}
                      {formatDistanceToNow(new Date(project.lastModified), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeletingProject({
                        id: project._id,
                        name: project.name,
                      });
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200 z-10 cursor-pointer shrink-0"
                    title="Delete project"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
      >
        <AlertDialogContent className="bg-zinc-950 border border-zinc-800 text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-white">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete{" "}
              <strong className="text-zinc-200">
                "{deletingProject?.name}"
              </strong>
              ? This action cannot be undone and will permanently delete all
              canvas designs, style guides, and uploaded assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel className="bg-transparent hover:bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white cursor-pointer rounded-full px-5 py-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer rounded-full px-5 py-2"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsList;
