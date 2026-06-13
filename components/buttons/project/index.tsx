"use client";
import { Button } from "@/components/ui/button";
import { useProjectCreation } from "@/hooks/use-project";
import { Loader2, PlusIcon, Star } from "lucide-react";
import Link from "next/link";
import React from "react";

const CreateProject = () => {
  const { createProject, isCreating, canCreate } = useProjectCreation();
  return (
    <>
      <Button
        variant="default"
        onClick={() => createProject()}
        disabled={!canCreate || isCreating}
        className="flex items-center gap-2 cursor-pointer rounded-full"
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PlusIcon className="h-4 w-4" />
        )}
        {isCreating ? "Creating..." : "New Project"}
      </Button>
      {/* Star on GitHub */}

      <Link
        href="https://github.com/scalewithalap/openui"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-1.5 rounded-full h-9 px-3.5 text-xs font-semibold border border-border bg-card hover:bg-secondary cursor-pointer shadow-3xs transition"
        title="Star OpenUI on GitHub"
      >
        <svg viewBox="0 0 24 24" className="size-3.5 fill-current">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
        <span>Star on GitHub</span>
        <Star className="size-3 fill-amber-500 text-amber-500" />
      </Link>
    </>
  );
};

export default CreateProject;
