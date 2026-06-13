import { cn } from "@/lib/utils";
import { ColorSwatch } from "../swatch";
import { Palette } from "lucide-react";

type Props = {
  title: string;
  swatches: Array<{
    name: string;
    hexColor: string;
    description?: string;
  }>;
  className?: string;
};

export const ColorTheme = ({ title, swatches, className }: Props) => {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div>
        <h3 className="text-lg font-medium text-foreground/50">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {swatches.map((swatch) => (
          <div key={swatch.name}>
            <ColorSwatch name={swatch.name} value={swatch.hexColor} />
            {swatch.description && (
              <p className="text-xs text-muted-foreground mt-2">
                {swatch.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ThemeContent = ({ colorGuide }: { colorGuide: any[] }) => {
  return (
    <>
      {colorGuide.length === 0 ? (
        <div className="space-y-8">
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
              <Palette className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No colors generated yet!
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Upload images to your mood board and generate an AI-powered style
              guide with colors & typography.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-10">
            {colorGuide.map((section: any, index: number) => (
              <ColorTheme
                key={index}
                title={section.title}
                swatches={section.swatches}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
