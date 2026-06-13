import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const generationApi = createApi({
  reducerPath: "generationApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/generate",
  }),
  tagTypes: ["Generation"],
  endpoints: (builder) => ({
    // Generate generation
    generateGeneration: builder.mutation({
      query: (data) => ({
        url: "/generate",
        method: "POST",
        body: data,
      }),
    }),
    // Redesign UI
    redesignUI: builder.mutation({
      query: (data) => ({
        url: "/redesign",
        method: "POST",
        body: data,
      }),
    }),
    // Generate workflow page
    generateWorkflow: builder.mutation({
      query: (data) => ({
        url: "/workflow",
        method: "POST",
        body: data,
      }),
    }),
    // Redesign workflow page
    redesignWorkflow: builder.mutation({
      query: (data) => ({
        url: "/workflow-redesign",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useGenerateGenerationMutation,
  useRedesignUIMutation,
  useGenerateWorkflowMutation,
  useRedesignWorkflowMutation,
} = generationApi;
