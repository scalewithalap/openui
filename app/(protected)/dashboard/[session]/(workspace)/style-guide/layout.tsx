import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, LayoutIcon, Type } from "lucide-react";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const tabs = [
  {
    value: "colors",
    label: "Colors",
    icon: Palette,
  },
  {
    value: "typography",
    label: "Typography",
    icon: Type,
  },
  {
    value: "moodboard",
    label: "Moodboard",
    icon: LayoutIcon,
  },
] as const;

const Layout = ({ children }: Props) => {
  return (
    <Tabs defaultValue="colors" className="w-full">
      <div className="mt-16 container mx-auto p-6">
        <div>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-left text-center font-bold text-foreground">
                Style Guide
              </h1>
              <p className="text-muted-foreground text-center lg:text-left">
                Manage style guide for your project
              </p>
            </div>
            <TabsList className="grid w-full sm:w-fit h-auto grid-cols-3 rounded-full backdrop-blur-xl bg-muted/60 dark:bg-white/8 border border-border dark:border-white/12 saturate-150 py-1.25 px-1.75">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="cursor-pointer w-auto h-full flex justify-center items-center gap-1.25 rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-card dark:data-[state=active]:bg-white/15 data-[state=active]:border data-[state=active]:border-border dark:data-[state=active]:border-white/20 data-[state=active]:shadow-xs transition-all duration-200 text-xs sm:text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.value}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-6 pb-12">{children}</div>
    </Tabs>
  );
};

export default Layout;
