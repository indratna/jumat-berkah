import { LandingStories } from "@/components/landing/landing-stories";
import { type LandingStory, getLandingStories } from "@/lib/landing";

export async function LandingStoriesSection() {
  let stories: LandingStory[] = [];

  try {
    stories = await getLandingStories(3);
  } catch (error) {
    console.error("Landing stories section failed", error);
  }

  if (stories.length === 0) {
    return null;
  }

  return <LandingStories stories={stories} />;
}