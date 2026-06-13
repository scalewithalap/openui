import ProjectsProvider from "@/components/projects/list/provider";
import { getAllProjects } from "@/lib/db/projects";
import ProjectsList from "@/components/projects/list";
import { Sparkles } from "lucide-react";
import Image from "next/image";

const Page = async () => {
  const projects = await getAllProjects();
  return (
    <ProjectsProvider initialProjects={projects}>
      <div className="container mx-auto py-20 px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="lg:col-span-3">
            <ProjectsList />
          </div>
          {/* Meet the Creator Sidebar Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-secondary flex items-center justify-center">
                  <Image
                    src="/alap.webp"
                    alt="Alap Putatunda"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover object-[center_15%]"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1">
                    Alap Putatunda
                    <Sparkles className="size-3 text-primary animate-pulse" />
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Founder of Scale with Alap
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-foreground/70 leading-relaxed">
                <p className="font-medium text-foreground">
                  Hey, I'm Alap, the creator of Vibe44 and founder of{" "}
                  <u>Scale with Alap</u>.
                </p>
                <p>
                  I've built Vibe44, the 100% AI-agent-native Next.js SaaS
                  boilerplate designed to get your startup live in days. It
                  comes pre-packaged with a 5-provider payment adapter,
                  RAG-ready voice, secure auth, robust AI integrations, and many
                  more features.
                </p>
                <p>
                  I also run Scale with Alap, where we deploy fully-managed 24/7
                  AI voice and chat agents to capture and book leads directly
                  into your calendar.
                </p>
              </div>

              <div className="space-y-3">
                {/* Vibe44 promo item */}
                <a
                  href="https://vibe44.com"
                  target="_blank"
                  className="group block p-3 rounded-xl border border-border bg-secondary/35 hover:bg-secondary/70 hover:border-primary/45 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      Vibe44
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                      Launch Offer - $90 Off
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    The 100% AI-agent-native Next.js SaaS boilerplate. Includes
                    5-provider payment adapter, auth, database, RAG + AI +
                    voice, and many more.
                  </p>
                </a>

                {/* Scale with Alap promo item */}
                <a
                  href="https://scalewithalap.com"
                  target="_blank"
                  className="group block p-3 rounded-xl border border-border bg-secondary/35 hover:bg-secondary/70 hover:border-primary/45 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      Scale with Alap
                    </span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      AI Lead Booking
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Fully-managed 24/7 AI agents booking appointments straight
                    to your calendar. No vague consulting; pay only for
                    outcomes.
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProjectsProvider>
  );
};

export default Page;
