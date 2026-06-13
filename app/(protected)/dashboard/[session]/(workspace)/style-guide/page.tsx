import MoodBoard from "@/components/style/moodboard";
import { ThemeContent } from "@/components/style/theme";
import StyleGuideTypography from "@/components/style/typography";
import { TabsContent } from "@/components/ui/tabs";
import { getProjectStyleGuide } from "@/lib/db/projects";
import { getMoodBoardImages } from "@/lib/db/images";
import { MoodBoardImage } from "@/hooks/use-styles";
import { StyleGuide } from "@/redux/api/style-guide";
import React from "react";

type Props = {
  searchParams: Promise<{
    project: string;
  }>;
};

const Page = async ({ searchParams }: Props) => {
  const projectId = (await searchParams).project;
  const guide = (await getProjectStyleGuide(projectId)) as unknown as StyleGuide;

  const colorGuide = guide?.colorSections || [];
  const typographyGuide = guide?.typographySections || [];

  const guideImages = (await getMoodBoardImages(projectId)) as unknown as MoodBoardImage[];
  return (
    <div>
      <TabsContent value="colors" className="space-y-8">
        <ThemeContent colorGuide={colorGuide} />
      </TabsContent>
      <TabsContent value="typography">
        <StyleGuideTypography typographyGuide={typographyGuide} />
      </TabsContent>
      <TabsContent value="moodboard">
        <MoodBoard guideImages={guideImages} />
      </TabsContent>
    </div>
  );
};

export default Page;
