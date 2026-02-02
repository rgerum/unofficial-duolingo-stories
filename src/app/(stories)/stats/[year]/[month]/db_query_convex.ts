import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../convex/_generated/api";

export interface StatsCourseProps {
  id: number;
  learning_language: number;
  from_language: number;
  public: boolean;
}

export interface StatsLanguageProps {
  id: number;
  name: string;
  short: string;
  flag: number | null;
  flag_file: string | null;
  speaker: string | null;
  default_text: string | null;
  tts_replace: string | null;
  public: boolean;
  rtl: boolean;
}

export async function get_stats(year: number, month: number) {
  const result = await fetchQuery(api.stats.getMonthlyStats, { year, month });

  return {
    year: result.year,
    month: result.month,
    stories_published: result.stories_published,
    stories_read: result.stories_read,
    active_users: result.active_users,
    active_users_count: result.active_users_count,
    active_stories: result.active_stories,
    courses: result.courses as StatsCourseProps[],
    languages: result.languages as StatsLanguageProps[],
  };
}

export async function has_stats(year: number, month: number): Promise<boolean> {
  return await fetchQuery(api.stats.hasStatsForMonth, { year, month });
}
