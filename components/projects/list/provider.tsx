"use client";
import { fetchProjectsSuccess } from "@/redux/slice/projects";
import { useAppDispatch } from "@/redux/store";
import React, { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  initialProjects: any;
};

const ProjectsProvider = ({ children, initialProjects }: Props) => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    // Initialize Redux state with SSR data
    if (initialProjects) {
      const projectsData = Array.isArray(initialProjects)
        ? initialProjects
        : (initialProjects._valueJSON || []);
      dispatch(
        fetchProjectsSuccess({
          projects: projectsData,
          total: projectsData.length,
        })
      );
    }
  }, [dispatch, initialProjects]);

  return <>{children}</>;
};

export default ProjectsProvider;
