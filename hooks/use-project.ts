"use client";

import {
  addProject,
  createProjectFailure,
  createProjectStart,
  createProjectSuccess,
  removeProject,
} from "@/redux/slice/projects";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { toast } from "sonner";
import { nanoid } from "@reduxjs/toolkit";
import { useRouter } from "next/navigation";

const generateGradientThumbnail = () => {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  ];

  const randomGradient =
    gradients[Math.floor(Math.random() * gradients.length)];
  const svgContent = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${
            randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[0] || "#667eea"
          }" />
          <stop offset="100%" style="stop-color:${
            randomGradient.match(/#[a-fA-F0-9]{6}/g)?.[1] || "#764ba2"
          }" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <circle cx="150" cy="100" r="30" fill="white" opacity="0.8" />
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

export const useProjectCreation = () => {
  const dispatch = useAppDispatch();
  const projectsState = useAppSelector((state) => state.projects);
  const router = useRouter();

  const createProject = async (name?: string) => {
    dispatch(createProjectStart());
    try {
      const thumbnail = generateGradientThumbnail();
      const frameId = nanoid();
      const defaultSketchesData = {
        shapes: {
          ids: [frameId],
          entities: {
            [frameId]: {
              id: frameId,
              type: "frame",
              x: 100,
              y: 100,
              w: 1600,
              h: 900,
              frameNumber: 1,
              stroke: "transparent",
              strokeWidth: 0,
              fill: "rgba(255, 255, 255, 0.05)",
            },
          },
        },
        tool: "select",
        selected: {},
        frameCounter: 1,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          sketchesData: defaultSketchesData,
          thumbnail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const result = await response.json();
      dispatch(
        addProject({
          _id: result.projectId,
          name: result.name,
          projectNumber: result.projectNumber,
          thumbnail,
          lastModified: Date.now(),
          createdAt: Date.now(),
          isPublic: false,
        })
      );
      dispatch(createProjectSuccess());
      toast.success(`${result.name} created successfully!`);
      
      // Automatically navigate and open the project canvas
      router.push(`/dashboard/workspace/canvas?project=${result.projectId}`);
    } catch (error) {
      console.error(error);
      dispatch(createProjectFailure("Failed to create project!"));
      toast.error("Failed to create project! Please try again.");
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      dispatch(removeProject(id));
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete project. Please try again.");
    }
  };

  return {
    createProject,
    deleteProject,
    isCreating: projectsState.isCreating,
    projects: projectsState.projects,
    projectsTotal: projectsState.total,
    canCreate: true,
  };
};
