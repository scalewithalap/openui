import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Loading = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2
          className={cn(
            "h-8 w-8 animate-spin text-primary",
            "transition-colors duration-200"
          )}
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Loading Dashboard
          </p>
          <p className="text-xs text-muted-foreground">
            Preparing your workspace...
          </p>
        </div>
      </div>
    </div>
  );
};
export default Loading;
