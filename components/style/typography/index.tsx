import { TypographySection } from "@/redux/api/style-guide";
import { Type } from "lucide-react";
import React from "react";

type Props = {
  typographyGuide: any;
};

const StyleGuideTypography = ({ typographyGuide }: Props) => {
  return (
    <>
      {typographyGuide.length === 0 ? (
        <div className="text-center py-20">
          <Type className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No typography generated yet!
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Generate a style guide to see AI-powered typography recommendations.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {typographyGuide.map((section: TypographySection, index: number) => (
            <div key={index} className="flex flex-col gap-5">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  {section.title}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.styles?.map((style: any, styleIndex: number) => (
                  <div
                    key={styleIndex}
                    className="p-6 rounded-2xl backdrop-blur-xl bg-card dark:bg-white/2 border border-border/80 dark:border-white/8 shadow-3xs dark:shadow-none saturate-150"
                  >
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-foreground mb-1">
                        {style.name}
                      </h4>
                      {style.description && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {style.description}
                        </p>
                      )}
                    </div>
                    <div
                      className="text-foreground"
                      style={{
                        fontFamily: style.fontFamily,
                        fontSize: style.fontSize,
                        fontWeight: style.fontWeight,
                        lineHeight: style.lineHeight,
                        letterSpacing: style.letterSpacing || "normal",
                      }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Font: {style.fontFamily}</div>
                      <div>Size: {style.fontSize}</div>
                      <div>Weight: {style.fontWeight}</div>
                      <div>Line Height: {style.lineHeight}</div>
                      {style.letterSpacing && (
                        <div>Letter Spacing: {style.letterSpacing}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default StyleGuideTypography;
