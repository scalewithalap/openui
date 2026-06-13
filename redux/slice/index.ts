import { Reducer } from "@reduxjs/toolkit";
import projects from "./projects";
import shapes from "./shapes";
import viewport from "./viewport";
import chat from "./chat";
import styleGuide from "./style-guide";

export const slices: Record<string, Reducer> = {
  projects,
  shapes,
  viewport,
  chat,
  styleGuide,
};
