import ProjectProvider from "@/components/projects/provider";
import { getProject } from "@/lib/db/projects";
import InfiniteCanvas from "@/components/canvas";
import React from "react";

interface CanvasPageProps {
  searchParams: Promise<{ project?: string }>;
}

const Page = async ({ searchParams }: CanvasPageProps) => {
  const params = await searchParams;
  const projectId = params.project;
  if (!projectId) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No project selected!</p>
      </div>
    );
  }

  const project = await getProject(projectId);

  if (!project) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-500">Project not found!</p>
      </div>
    );
  }
  return (
    <ProjectProvider initialProject={project}>
      <InfiniteCanvas />
    </ProjectProvider>
  );
};

export default Page;
