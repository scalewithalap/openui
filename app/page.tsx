"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
  Code2,
  Download,
  Compass,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  MousePointer,
  Menu,
  X,
  Database,
  Cpu,
  Monitor,
  GitCompare,
  Eye,
  CheckCircle,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/navbar/theme-toggle";
import Image from "next/image";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<
    "react" | "vue" | "svelte" | "angular" | "html"
  >("react");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Raw framework translation codes
  const codePreviews = {
    react: `import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function PromoCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="size-4 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase">New UI</span>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">AI Canvas Workspace</h3>
      <p className="text-xs text-muted-foreground mb-4">Stream UI components directly.</p>
      <button className="w-full flex items-center justify-center gap-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg">
        <span>Get App</span>
        <ArrowRight className="size-3" />
      </button>
    </div>
  );
}`,
    vue: `<script setup>
import { ArrowRight, Sparkles } from 'lucide-vue-next';
</script>

<template>
  <div class="bg-card border border-border rounded-xl p-6 shadow-md">
    <div class="flex items-center gap-2 mb-4">
      <Sparkles class="size-4 text-primary" />
      <span class="text-xs font-bold text-muted-foreground uppercase">New UI</span>
    </div>
    <h3 class="text-lg font-bold text-foreground mb-1">AI Canvas Workspace</h3>
    <p class="text-xs text-muted-foreground mb-4">Stream UI components directly.</p>
    <button class="w-full flex items-center justify-center gap-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg">
      <span>Get App</span>
      <ArrowRight class="size-3" />
    </button>
  </div>
</template>`,
    svelte: `<script>
  import { ArrowRight, Sparkles } from 'lucide-svelte';
</script>

<div class="bg-card border border-border rounded-xl p-6 shadow-md">
  <div class="flex items-center gap-2 mb-4">
    <Sparkles class="size-4 text-primary" />
    <span class="text-xs font-bold text-muted-foreground uppercase">New UI</span>
  </div>
  <h3 class="text-lg font-bold text-foreground mb-1">AI Canvas Workspace</h3>
  <p class="text-xs text-muted-foreground mb-4">Stream UI components directly.</p>
  <button class="w-full flex items-center justify-center gap-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg">
    <span>Get App</span>
    <ArrowRight class="size-3" />
  </button>
</div>`,
    angular: `import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-promo-card',
  standalone: true,
  imports: [LucideAngularModule],
  template: \`
    <div class="bg-card border border-border rounded-xl p-6 shadow-md">
      <div class="flex items-center gap-2 mb-4">
        <lucide-icon name="sparkles" class="text-primary"></lucide-icon>
        <span class="text-xs font-bold text-muted-foreground uppercase">New UI</span>
      </div>
      <h3 class="text-lg font-bold text-foreground mb-1">AI Canvas Workspace</h3>
      <p class="text-xs text-muted-foreground mb-4">Stream UI components directly.</p>
      <button class="w-full flex items-center justify-center gap-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg">
        <span>Get App</span>
        <lucide-icon name="arrow-right" class="size-3"></lucide-icon>
      </button>
    </div>
  \`
})
export class PromoCardComponent {}`,
    html: `<div class="bg-card border border-border rounded-xl p-6 shadow-md">
  <div class="flex items-center gap-2 mb-4">
    <span class="w-2 h-2 rounded-full bg-red-500"></span>
    <span class="text-xs font-bold text-muted-foreground uppercase">New UI</span>
  </div>
  <h3 class="text-lg font-bold text-foreground mb-1">AI Canvas Workspace</h3>
  <p class="text-xs text-muted-foreground mb-4">Stream UI components directly.</p>
  <button class="w-full flex items-center justify-center gap-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition">
    <span>Get App</span>
  </button>
</div>`,
  };

  // Simple regex-based syntax highlighter for presentation
  const highlightCode = (code: string) => {
    let html = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Highlight strings
    html = html.replace(
      /(['"`])(.*?)\1/g,
      '<span class="text-[#98c379]">$1$2$1</span>',
    );

    // Highlight keywords
    const keywords = [
      "import",
      "from",
      "export",
      "default",
      "function",
      "return",
      "const",
      "let",
      "class",
      "extends",
      "standalone",
      "selector",
      "template",
      "imports",
      "@Component",
      "script",
      "setup",
    ];
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "g");
      html = html.replace(regex, `<span class="text-[#c678dd]">${kw}</span>`);
    });

    // Highlight tag strings in HTML / Template sections
    const tags = [
      "div",
      "span",
      "h3",
      "p",
      "button",
      "template",
      "script",
      "lucide-icon",
    ];
    tags.forEach((tag) => {
      const regex1 = new RegExp(`&lt;${tag}\\b`, "g");
      html = html.replace(
        regex1,
        `&lt;<span class="text-[#e06c75] font-semibold">${tag}</span>`,
      );
      const regex2 = new RegExp(`&lt;\\/${tag}&gt;`, "g");
      html = html.replace(
        regex2,
        `&lt;/<span class="text-[#e06c75] font-semibold">${tag}</span>&gt;`,
      );
    });

    // Highlight component names (capitalized words in tag context)
    html = html.replace(
      /&lt;([A-Z][a-zA-Z0-9-]*)/g,
      '&lt;<span class="text-[#e5c07b]">$1</span>',
    );
    html = html.replace(
      /&lt;\/([A-Z][a-zA-Z0-9-]*)/g,
      '&lt;/<span class="text-[#e5c07b]">$1</span>',
    );

    return (
      <code className="block" dangerouslySetInnerHTML={{ __html: html }} />
    );
  };

  const featureItems = [
    {
      icon: <Sparkles className="size-5" />,
      title: "AI UI Generation",
      description:
        "Observe HTML and Tailwind CSS compile before your eyes in real time. Write a descriptive text prompt and watch your layout stream instantly.",
      colorClass: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      icon: <Cpu className="size-5" />,
      title: "Searchable Model Registry",
      description:
        "Switch dynamically between OpenRouter, NVIDIA NIM, Anthropic, OpenAI, Gemini, or offline local Ollama vision models to suit your design context.",
      colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: <Zap className="size-5" />,
      title: "Live Token Injection",
      description:
        "Broadcasting CSS variable adjustments instantly into preview iframes via postMessage. Witness style guide edits apply in real-time.",
      colorClass: "text-[#db2800] bg-[#db2800]/10 border-[#db2800]/20",
    },
    {
      icon: <Layers className="size-5" />,
      title: "Type-Safe Design Tokens",
      description:
        "Strong-typed ExtendedStyleGuide schemas sync both ways with standard DESIGN.md markdown frontmatter. Edit visually or code directly.",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: <GitCompare className="size-5" />,
      title: "A/B Variant Comparisons",
      description:
        "Generate up to 5 visual variations of a screen simultaneously. Compare them side-by-side in synchronized iframes, pick winners, and prune.",
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: <Monitor className="size-5" />,
      title: "Theme Presets & AI Generator",
      description:
        "Apply 10 curated style guides in one click, or write descriptions like 'cyberpunk neon' to generate custom token palettes with AI.",
      colorClass: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
    },
    {
      icon: <Compass className="size-5" />,
      title: "Infinite Canvas & Guides",
      description:
        "Pan and zoom from 0.1x to 8x. Align shapes using a 20px snap grid and 6px threshold edge detection guides, plus a proportional SVG minimap.",
      colorClass: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: <Code2 className="size-5" />,
      title: "Multi-Screen Workflows",
      description:
        "Generate interconnected user flows with multiple canvas screens. Refine individual screen templates while keeping design consistency in sync.",
      colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
  ];

  const workflowSteps = [
    {
      number: "01",
      title: "Environment Setup",
      description:
        "Copy .env.example to .env.local, add your API keys or turn on OLLAMA_ENABLED=true for a fully offline setup.",
    },
    {
      number: "02",
      title: "Select Generative Model",
      description:
        "Choose from OpenRouter, Anthropic, OpenAI, or local models via the searchable provider dropdown list.",
    },
    {
      number: "03",
      title: "Moodboard Extraction",
      description:
        "Upload reference inspiration screenshots; our k-means algorithm will extract color palettes to seed your styles.",
    },
    {
      number: "04",
      title: "Draft UI wireframes",
      description:
        "Drag rectangular canvas frames, place notes, select custom style presets, and click Generate to run the AI compiler.",
    },
    {
      number: "05",
      title: "Theme & Propagate",
      description:
        "Fine-tune typography, corners, and contrast values. Retheme all canvas pages in one batch with live variable sync.",
    },
    {
      number: "06",
      title: "Translate & Export",
      description:
        "Convert HTML/Tailwind to React, Vue, Svelte, or Angular, and export layouts as structured ZIP bundles in one-click.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col font-sans transition-colors duration-300">
      {/* Background radial gradients for aesthetics */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none -z-10 dark:bg-primary/5" />
      <div className="absolute bottom-1/3 left-0 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-3xl pointer-events-none -z-10 dark:bg-primary/5" />
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] rounded-full bg-primary/5 blur-3xl pointer-events-none -z-10" />

      {/* Decorative dot grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-15 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(120, 120, 120, 0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Sticky Header Navbar */}
      <header className="w-full h-16 border-b border-border/60 bg-background/85 backdrop-blur-md sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hover:scale-[1.02] active:scale-95 transition flex items-center shrink-0"
          >
            <Image
              src="/logo-light.png"
              alt="OpenUI Logo"
              width={663}
              height={182}
              className="h-7 w-auto block dark:hidden object-contain"
            />
            <Image
              src="/logo-dark.png"
              alt="OpenUI Logo"
              width={663}
              height={182}
              className="h-7 w-auto hidden dark:block object-contain"
            />
          </Link>
          <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold">
            v1.0.0
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link
            href="#features"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Features
          </Link>
          <Link
            href="#workflow"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Workflow
          </Link>
          <Link
            href="#code-export"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Code Export
          </Link>
          <Link
            href="#architecture"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            Architecture
          </Link>
          <Link
            href="#about"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition"
          >
            About Me
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/dashboard/workspace" className="hidden sm:block">
            <Button className="rounded-full h-10 px-6 w-48 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-xs active:scale-95 transition flex items-center gap-1.5">
              <span>Go to Workspace</span>
              <ChevronRight className="size-4" />
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-secondary transition active:scale-95"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-12 py-24 space-y-12 z-10">
        <section className="flex flex-col items-center text-center space-y-6 mx-auto pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkles className="size-3" />
            <span>The Open-source Google Stitch Alternative</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-8xl font-heading font-black tracking-tight text-foreground leading-[1.15]">
            AI-agnostic, Local & Open-source{" "}
            <span className="bg-linear-to-r from-primary via-[#ff4a22] to-amber-500 bg-clip-text text-transparent">
              UI Design Platform.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-xl text-muted-foreground leading-relaxed">
            A developer-first prototyping co-pilot. Draw shape frames on an
            infinite canvas, watch AI stream responsive UI in real time, and
            propagate custom style guides to all screens simultaneously.
            Local-first, open-source, and provider-agnostic.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Link href="/#features">
              <Button
                size="lg"
                className="rounded-full h-10 px-6 w-48 text-sm font-bold bg-primary hover:bg-primary/95 text-primary-foreground cursor-pointer shadow-md active:scale-95 transition flex items-center gap-2 group"
              >
                <span>Explore Features</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {/* Star on GitHub */}
            <a
              href="https://github.com/scalewithalap/openui"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 rounded-full h-10 px-4 text-xs font-semibold border border-border bg-card hover:bg-secondary cursor-pointer shadow-3xs transition"
              title="Star OpenUI on GitHub"
            >
              <svg viewBox="0 0 24 24" className="size-4 fill-current">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <span>Star on GitHub</span>
              <Star className="size-3.5 fill-amber-500 text-amber-500" />
            </a>
          </div>
        </section>

        {/* Hero Mockup Workspace Frame */}
        <section className="relative rounded-2xl border border-border/80 bg-card/45 backdrop-blur-md shadow-2xl p-2.5 overflow-hidden transition-all duration-500 hover:shadow-primary/5">
          <div className="absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-amber-500/5 opacity-50" />

          <div className="w-full rounded-xl border border-border/40 overflow-hidden relative group shadow-inner">
            <Image
              src="/canvas-mockup-light.png"
              alt="OpenUI Workspace Canvas Light"
              width={1920}
              height={1080}
              priority
              className="w-full h-auto rounded-lg transition-transform duration-700 group-hover:scale-[1.01] block dark:hidden"
            />
            <Image
              src="/canvas-mockup.png"
              alt="OpenUI Workspace Canvas Dark"
              width={1920}
              height={1080}
              priority
              className="w-full h-auto rounded-lg transition-transform duration-700 group-hover:scale-[1.01] hidden dark:block"
            />
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section
          id="features"
          className="space-y-16 py-8 border-t border-border/40"
        >
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
              Engineered for Rapid Iteration
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              OpenUI connects live visual canvas controls directly to
              production-ready component structures, making building web apps
              feel fast and intuitive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureItems.map((item, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-primary/45 hover:shadow-md transition duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center border ${item.colorClass}`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Creative Workflow Timeline */}
        <section
          id="workflow"
          className="space-y-16 py-8 border-t border-border/40"
        >
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
              The Creative Workflow
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Step through the process of designing, refining, and exporting
              layouts within the OpenUI ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
            {workflowSteps.map((step, idx) => (
              <div
                key={idx}
                className="relative bg-card border border-border/80 rounded-2xl p-6 space-y-4 hover:shadow-xs transition"
              >
                <div className="absolute top-4 right-6 text-4xl font-black text-primary/10 select-none">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Interactive Code Export Previewer */}
        <section
          id="code-export"
          className="space-y-12 py-8 border-t border-border/40"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Description Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
                <Code2 className="size-3.5" />
                <span>Instant Code Export</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground leading-tight">
                Framework Translation Pipeline
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                OpenUI compiles HTML and custom style guides, translating
                components into highly optimized, clean, and functional
                components for your framework of choice.
              </p>
              <div className="space-y-3">
                {[
                  "Exports Tailwind CSS class utilities",
                  "Preserves responsive layout hooks",
                  "Translates Lucide React icons automatically",
                  "Modular code structures ready for import",
                ].map((bullet, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs font-semibold text-foreground/80"
                  >
                    <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Code Box */}
            <div className="lg:col-span-7 bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 lg:p-6 overflow-hidden flex flex-col space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-zinc-800 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                {/* Tabs selection */}
                <div className="flex bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 p-0.5 rounded-lg">
                  {(["react", "vue", "svelte", "angular", "html"] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition ${
                          activeTab === tab
                            ? "bg-primary text-white shadow-xs"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tab}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Code window container */}
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-900 overflow-hidden min-h-[300px] flex flex-col justify-between">
                <pre className="text-xs font-mono text-zinc-300 dark:text-zinc-400 overflow-x-auto select-all leading-relaxed whitespace-pre-wrap block">
                  {highlightCode(codePreviews[activeTab])}
                </pre>

                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-4 text-[10px] text-zinc-500 font-bold">
                  <span>
                    {activeTab === "html"
                      ? "index.html"
                      : `PromoCard.${activeTab === "vue" ? "vue" : activeTab === "svelte" ? "svelte" : "ts"}`}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codePreviews[activeTab]);
                    }}
                    className="hover:text-zinc-300 transition cursor-pointer flex items-center gap-1"
                  >
                    <Download className="size-3" />
                    <span>Copy Code</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local-First Architecture Detail Section */}
        <section
          id="architecture"
          className="space-y-16 py-8 border-t border-border/40"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Diagram / Technical Stack Mock */}
            <div className="lg:col-span-6 order-last lg:order-first grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:shadow-xs transition">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Database className="size-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground">
                    SQLite Storage
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Zero cloud database latency. OpenUI writes layouts, guides,
                    and history configurations directly to your local
                    data/openui.db folder.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:shadow-xs transition">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground">
                    Prisma Client ORM
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Robust local queries. Schema migrations and type generation
                    run inside your native node_modules workspace, keeping data
                    reliable.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:shadow-xs transition">
                <div className="size-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-500/20">
                  <Cpu className="size-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground">
                    100% Offline Generation
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Set OLLAMA_ENABLED=true in .env.local to route canvas
                    requests through local Ollama vision models (e.g. minicpm-v)
                    entirely offline.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:shadow-xs transition">
                <div className="size-10 rounded-xl bg-[#db2800]/10 text-[#db2800] flex items-center justify-center border border-[#db2800]/20">
                  <Eye className="size-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-foreground">
                    WCAG Contrast Checker
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Evaluates contrast compliance (AA/AAA) on text color
                    swatches dynamically, ensuring accessible layouts on the
                    fly.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Description Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20">
                <Database className="size-3.5" />
                <span>Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground leading-tight">
                Secure, Local-First, & Offline Prototyping
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                OpenUI runs as a fully contained Next.js project on your
                machine. Your assets, color preset choices, sketches, and
                designs never leave your local environment. Zero usage-limit
                tiers, no cloud subscription databases, and no forced sign-ins.
              </p>
              <div className="p-5 border border-border/80 bg-secondary/25 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-foreground">
                  Ready to spin up?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Run a single setup command to migrate your SQLite database
                  schema, generate types, and prepare the local Prisma client
                  before booting the development server.
                </p>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 flex justify-between items-center select-all">
                  <span>npm run setup && npm run dev</span>
                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-bold uppercase select-none">
                    CMD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Creator & Promotion Section */}
        <section
          id="about"
          className="rounded-3xl border border-border bg-linear-to-br from-card to-secondary/35 p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative overflow-hidden"
        >
          <div className="lg:col-span-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
              <ShieldCheck className="size-3.5" />
              <span>Meet the Author</span>
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-heading font-black text-foreground">
                Alap Putatunda
              </h3>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Founder of Scale with Alap & Creator of Vibe44
              </p>
            </div>

            <blockquote className="text-sm text-muted-foreground border-l-2 border-primary/50 pl-4 italic leading-relaxed">
              &quot;Hey, I&apos;m Alap — creator of Vibe44 and founder of Scale
              with Alap. I run one fully-managed system for high-ticket local
              service businesses: a 24/7 AI agent that captures, qualifies, and
              books every inbound lead straight into your calendar. And you only
              pay for the outcome: booked appointments.&quot;
            </blockquote>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="https://scalewithalap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-foreground font-bold hover:underline"
              >
                <span>scalewithalap.com</span>
                <ExternalLink className="size-3" />
              </a>
              <span className="text-muted-foreground/30">•</span>
              <a
                href="https://vibe44.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
              >
                <span>vibe44.com</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Vibe44 Boilerplate
              </span>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                Boilerplate
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Looking to ship an AI SaaS in a weekend? Check out{" "}
              <strong>Vibe44</strong>, the ultimate agent-native Next.js
              boilerplate. Pre-wired with 5-provider billing, RAG voice chat,
              Impersonation filters, and OWASP Top 10 compliance.
            </p>
            <a
              href="https://vibe44.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-white font-bold text-xs shadow-xs active:scale-98 transition"
            >
              Learn More
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-card/45 py-12 px-6 lg:px-12 text-xs text-muted-foreground select-none relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-left">
          <div className="space-y-3">
            <Link
              href="/"
              className="hover:scale-[1.01] active:scale-95 transition flex items-center shrink-0 w-max"
            >
              <Image
                src="/logo-light.png"
                alt="OpenUI Logo"
                width={663}
                height={182}
                className="h-6 w-auto block dark:hidden object-contain"
              />
              <Image
                src="/logo-dark.png"
                alt="OpenUI Logo"
                width={663}
                height={182}
                className="h-6 w-auto hidden dark:block object-contain"
              />
            </Link>
            <p className="text-muted-foreground/85 leading-relaxed max-w-[200px] mt-2">
              Local-first, provider-agnostic UI prototyping platform powered by
              AI.
            </p>
          </div>
          <div className="space-y-3 flex flex-col">
            <h5 className="font-bold text-foreground">Navigation</h5>
            <Link
              href="#features"
              className="hover:underline hover:text-foreground transition"
            >
              Features
            </Link>
            <Link
              href="#workflow"
              className="hover:underline hover:text-foreground transition"
            >
              Workflow
            </Link>
            <Link
              href="#code-export"
              className="hover:underline hover:text-foreground transition"
            >
              Code Export
            </Link>
            <Link
              href="#architecture"
              className="hover:underline hover:text-foreground transition"
            >
              Architecture
            </Link>
          </div>
          <div className="space-y-3 flex flex-col">
            <h5 className="font-bold text-foreground">Creator Projects</h5>
            <a
              href="https://vibe44.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-foreground transition"
            >
              Vibe44 Boilerplate
            </a>
            <a
              href="https://scalewithalap.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline hover:text-foreground transition"
            >
              Scale with Alap Agency
            </a>
          </div>
          <div className="space-y-3">
            <h5 className="font-bold text-foreground">Repository & License</h5>
            <p className="leading-relaxed">
              OpenUI is open-source and released under the MIT License. Fork,
              share, or build on top of it.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/40 text-[11px]">
          <span>OpenUI v1.0.0 · Local-first design environment</span>
          <span>Copyright © 2026 OpenUI. Built with ❤️ by Alap Putatunda.</span>
        </div>
      </footer>
    </div>
  );
}
