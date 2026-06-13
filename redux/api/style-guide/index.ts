import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface ColorSwatch {
  name: string;
  hexColor: string;
  description?: string;
}

export interface ColorSection {
  title:
    | "Primary Colors"
    | "Secondary & Accent Colors"
    | "UI Component Colors"
    | "Utility & Form Colors"
    | "Status & Feedback Colors";
  swatches: ColorSwatch[];
}

export interface ColorSection {
  title:
    | "Primary Colors"
    | "Secondary & Accent Colors"
    | "UI Component Colors"
    | "Utility & Form Colors"
    | "Status & Feedback Colors";
  swatches: ColorSwatch[];
}

export interface TypographyStyle {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
  description?: string;
}

export interface TypographySection {
  title: string;
  styles: TypographyStyle[];
}

export interface StyleGuide {
  theme: string;
  description: string;
  colorSections: [
    ColorSection,
    ColorSection,
    ColorSection,
    ColorSection,
    ColorSection,
  ];
  typographySections: [TypographySection, TypographySection, TypographySection];
}

export interface GenerateStyleGuideRequest {
  projectId: string;
}

export interface GenerateStyleGuideResponse {
  success: boolean;
  styleGuide: StyleGuide;
  message: string;
}

export const styleGuideApi = createApi({
  reducerPath: "styleGuideApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/generate",
  }),
  tagTypes: ["StyleGuide"],
  endpoints: (builder) => ({
    generateStyleGuide: builder.mutation<
      GenerateStyleGuideResponse,
      GenerateStyleGuideRequest
    >({
      query: ({ projectId }) => ({
        url: "/style",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: { projectId },
      }),
      invalidatesTags: ["StyleGuide"],
    }),
  }),
});

export const { useGenerateStyleGuideMutation } = styleGuideApi;
