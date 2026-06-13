import { NextResponse } from "next/server";
import { fetchAllModels, getEnabledProviders, type AvailableModel } from "@/lib/ai/model-listing";

// Simple in-memory cache
let cachedModels: AvailableModel[] | null = null;
let cacheTime = 0;
let cachedProvidersHash = "";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    const enabledProviders = getEnabledProviders();
    const providersHash = enabledProviders.join(",");

    if (cachedModels && now - cacheTime < CACHE_TTL_MS && providersHash === cachedProvidersHash) {
      return NextResponse.json({
        models: cachedModels,
        enabledProviders,
      });
    }

    const models = await fetchAllModels();
    cachedModels = models;
    cacheTime = now;
    cachedProvidersHash = providersHash;

    return NextResponse.json({
      models,
      enabledProviders,
    });
  } catch (error) {
    console.error("Error in GET /api/models:", error);
    return NextResponse.json(
      { error: "Failed to load models" },
      { status: 500 },
    );
  }
}
