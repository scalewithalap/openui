"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  ChevronDown,
  Sparkles,
  Check,
  Image as ImageIcon,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Model {
  id: string;
  name: string;
  provider: string;
  rawId: string;
  supportsVision?: boolean;
}

export default function ModelSelector() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch models and current selection
    async function load() {
      if (!projectId) return;
      try {
        setLoading(true);
        // 1. Fetch available models
        const modelsRes = await fetch("/api/models");
        if (!modelsRes.ok) throw new Error("Failed to load models list");
        const modelsData = await modelsRes.json();
        setModels(modelsData.models || []);

        // 2. Fetch selected model
        const selectRes = await fetch(
          `/api/models/select?projectId=${projectId}`,
        );
        if (selectRes.ok) {
          const selectData = await selectRes.json();
          if (selectData.model) {
            setSelectedModel(selectData.model);
          } else {
            // Default fallback
            const fallback =
              process.env.NEXT_PUBLIC_OPENUI_FALLBACK_MODEL ||
              "openrouter/anthropic/claude-opus-4";
            setSelectedModel(fallback);
          }
        }
      } catch (err) {
        console.error("Error loading model selector data:", err);
        toast.error("Failed to load AI models");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Close dropdown on click outside or when an iframe (canvas preview) gains focus
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleBlur() {
      // Check after one frame if the new active element is an iframe
      setTimeout(() => {
        if (
          document.activeElement &&
          document.activeElement.tagName === "IFRAME"
        ) {
          setIsOpen(false);
        }
      }, 0);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const handleSelect = async (modelId: string, provider: string) => {
    if (!projectId) return;
    try {
      setSelectedModel(modelId);
      setIsOpen(false);
      const res = await fetch("/api/models/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          provider,
          model: modelId,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message || errData.error || "Failed to save selection",
        );
      }
      const modelName = modelId.split("/").pop() || "";
      const capitalized = modelName.replace(/(^\w|-\w)/g, (m) => m.toUpperCase());
      toast.success(`Active model updated: ${capitalized}`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to save model selection: ${err.message || err}`);
    }
  };

  // Group and filter models
  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped: Record<string, Model[]> = {};
  filteredModels.forEach((m) => {
    if (!grouped[m.provider]) grouped[m.provider] = [];
    grouped[m.provider].push(m);
  });

  const formatModelName = (name: string, provider: string) => {
    if (provider === "openrouter" && name.includes(":")) {
      return name.split(":").slice(1).join(":").trim();
    }
    return name;
  };

  const getDisplayName = (id: string) => {
    const found = models.find((m) => m.id === id);
    if (found) return formatModelName(found.name, found.provider);
    return id.split("/").pop() || id;
  };

  // Sort groups: Provider containing selected model comes first
  const sortedGroupedEntries = Object.entries(grouped).sort(
    ([provA, modelsA], [provB, modelsB]) => {
      const hasSelectedA = modelsA.some((m) => m.id === selectedModel);
      const hasSelectedB = modelsB.some((m) => m.id === selectedModel);
      if (hasSelectedA && !hasSelectedB) return -1;
      if (!hasSelectedA && hasSelectedB) return 1;
      return 0;
    },
  );

  // Sort models in a group: Selected model comes first
  const getSortedModels = (providerModels: Model[]) => {
    return [...providerModels].sort((a, b) => {
      if (a.id === selectedModel) return -1;
      if (b.id === selectedModel) return 1;
      return 0;
    });
  };

  if (!projectId) return null;

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 rounded-full px-4 h-8 text-xs font-semibold border border-border bg-card text-foreground hover:bg-secondary transition disabled:opacity-50 shadow-3xs cursor-pointer"
      >
        <Sparkles className="size-3.5 text-primary" />
        <span className="max-w-[130px] truncate capitalize">
          {loading ? "Loading AI models..." : getDisplayName(selectedModel)}
        </span>
        <ChevronDown className="size-3.5 opacity-85" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-82 rounded-2xl border border-border bg-card shadow-lg z-100 overflow-hidden">
          <div className="p-3 border-b border-border/60 flex items-center gap-2">
            <Search className="size-4 text-muted-foreground/80" />
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder-muted-foreground/50"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {sortedGroupedEntries.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No models found!
              </div>
            ) : (
              sortedGroupedEntries.map(([provider, providerModels]) => (
                <div key={provider} className="mb-3">
                  <div className="px-3 py-1 text-[10px] underline underline-offset-1 font-bold text-muted-foreground uppercase tracking-wider">
                    {provider}
                  </div>
                  <div className="mt-1 space-y-1">
                    {getSortedModels(providerModels).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleSelect(m.id, m.provider)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition cursor-pointer border ${
                          selectedModel === m.id
                            ? "bg-primary/10 text-primary border-primary/20 font-bold"
                            : "text-foreground hover:bg-secondary border-transparent hover:text-foreground"
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-sm capitalize font-semibold">
                            {formatModelName(m.name, m.provider)}
                          </span>
                          <span className="text-xs text-foreground/50 wrap-break-word">
                            {m.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {m.supportsVision && selectedModel !== m.id && (
                            <span title="Supports vision input">
                              <ImageIcon className="size-3 text-muted-foreground/75" />
                            </span>
                          )}
                          {selectedModel === m.id && (
                            <CheckCircle className="size-3.5 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
