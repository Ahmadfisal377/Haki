export type Lang = "en" | "ar";
export type Dir = "ltr" | "rtl";

/** Static catalog items (Talk topics, Activities). */
export type TopicCategory = "light" | "medium" | "deep" | "flirty";
export type InterestKey =
  | "humor" | "food" | "music" | "travel" | "movies" | "fitness"
  | "family" | "faith" | "tech" | "fashion" | "growth";

export type Topic = {
  id: string;
  category: TopicCategory;
  tags: InterestKey[];
  text: Record<Lang, string>;
};

export type Activity = {
  id: string;
  cost: "free" | "low" | "mid";
  energy: "calm" | "active";
  tags: InterestKey[];
  text: Record<Lang, string>;
};

export type Situation = {
  id: string;
  label: Record<Lang, string>;
  lines: Array<Record<Lang, string>>;
  tip: Record<Lang, string>;
};

/** Database rows (subset of fields used in the UI). */
export type PartnerProfile = {
  partner_name: string;
  relationship_type: string;
  interests: InterestKey[];
  stress_pref: string;
  love_pref: string;
  energy_pref: string;
  notes: string;
};

export type MemoryCategory =
  | "preference" | "date" | "event" | "conversation" | "experience" | "note" | "milestone";

export type Memory = {
  id: string;
  category: MemoryCategory;
  content: string;
  source: string;
  confirmed: boolean;
  privacy_scope: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

export type ChatMsg = { role: "user" | "assistant"; content: string };

/** Candidate memory the AI proposes after a chat exchange. */
export type SuggestedMemory = {
  category: MemoryCategory;
  content: string;
  confidence: number;
};

export type Suggestion = { style: string; text: string };
export type Insight = { title: string; text: string };
