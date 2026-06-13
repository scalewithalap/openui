"use client";
import { loadProject } from "@/redux/slice/shapes";
import { restoreViewport } from "@/redux/slice/viewport";
import { useAppDispatch } from "@/redux/store";
import React, { useEffect } from "react";

type Props = { children: React.ReactNode; initialProject: any };

const ProjectProvider = ({ children, initialProject }: Props) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (initialProject) {
      const projectData = initialProject._valueJSON || initialProject;

      // Load the sketches data into the shapes Redux state
      if (projectData.sketchesData) {
        dispatch(loadProject(projectData.sketchesData));
      }

      // Restore viewport position if available (treat default initial viewport state as uninitialized)
      if (
        projectData.viewportData &&
        !(
          projectData.viewportData.scale === 1 &&
          projectData.viewportData.translate.x === 0 &&
          projectData.viewportData.translate.y === 0
        )
      ) {
        dispatch(restoreViewport(projectData.viewportData));
      } else {
        dispatch(restoreViewport(null));
      }
    }
  }, [dispatch, initialProject]);
  return <>{children}</>;
};

export default ProjectProvider;
