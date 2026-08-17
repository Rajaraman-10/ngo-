export const FOCUS_AREAS = [
  {
    key: "education",
    label: "Education",
    icon: "📚",
    tagline: "Every Child Deserves to Learn",
    description: "Education, learning resources, scholarships, and opportunities for children.",
    color: "var(--series-1)",
  },
  {
    key: "employment",
    label: "Employment",
    icon: "💼",
    tagline: "Everyone Deserves a Way to Earn",
    description: "Skills, training, and employment opportunities toward financial independence.",
    color: "var(--series-2)",
  },
  {
    key: "food",
    label: "Food",
    icon: "🍚",
    tagline: "No One Should Go Hungry",
    description: "Food programs today, working toward long-term food security.",
    color: "var(--series-3)",
  },
  {
    key: "home",
    label: "Home",
    icon: "🏠",
    tagline: "Everyone Deserves a Safe Home",
    description: "Helping families without adequate housing access safe, dignified shelter.",
    color: "var(--series-4)",
  },
  {
    key: "clean_india",
    label: "Clean India",
    icon: "🌱",
    tagline: "Clean Communities, Healthy Lives",
    description: "Cleaner streets, responsible waste management, sanitation, and awareness.",
    color: "var(--series-5)",
  },
];

export const FOCUS_AREA_MAP = Object.fromEntries(FOCUS_AREAS.map((f) => [f.key, f]));

export function focusAreaLabel(key) {
  return FOCUS_AREA_MAP[key]?.label || "Other";
}

export function focusAreaColor(key) {
  return FOCUS_AREA_MAP[key]?.color || "var(--text-muted)";
}
