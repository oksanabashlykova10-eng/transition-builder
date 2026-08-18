export const effectDefinitions = [
  {
    type: "neon-spinner",
    title: "Neon Spinner",
    icon: "◌",
    defaults: {
      primaryColor: "#59e8ff",
      secondaryColor: "#b56cff",
      count: 12,
      speed: 2.2,
      size: 18,
      intensity: 1,
    },
  },
  {
    type: "neon-sparks",
    title: "Neon Sparks",
    icon: "✦",
    defaults: {
      primaryColor: "#55e8ff",
      secondaryColor: "#ff58dc",
      count: 34,
      speed: 1.8,
      size: 8,
      intensity: 1,
    },
  },
  {
    type: "flying-spark",
    title: "Flying Spark",
    icon: "✧",
    defaults: {
      primaryColor: "#fff2a0",
      secondaryColor: "#ff8d38",
      count: 22,
      speed: 2.8,
      size: 10,
      intensity: 1,
    },
  },
  {
    type: "magic-dust",
    title: "Magic Dust",
    icon: "⋆",
    defaults: {
      primaryColor: "#e8c6ff",
      secondaryColor: "#8f64ff",
      count: 42,
      speed: 4.2,
      size: 7,
      intensity: 0.85,
    },
  },
  {
    type: "falling-objects",
    title: "Falling Objects",
    icon: "◆",
    defaults: {
      primaryColor: "#ffdc64",
      secondaryColor: "#ff789d",
      count: 28,
      speed: 3.6,
      size: 14,
      intensity: 1,
    },
  },
  {
    type: "fireflies",
    title: "Fireflies",
    icon: "•",
    defaults: {
      primaryColor: "#eaff74",
      secondaryColor: "#72ff9b",
      count: 30,
      speed: 4.8,
      size: 9,
      intensity: 0.9,
    },
  },
  {
    type: "dots-loader",
    title: "Dots Loader",
    icon: "•••",
    defaults: {
      primaryColor: "#58eaff",
      secondaryColor: "#bd72ff",
      count: 8,
      speed: 1.4,
      size: 20,
      intensity: 1,
    },
  },
] as const;

export type BuiltInEffectType = (typeof effectDefinitions)[number]["type"];
export const effectDefinition = (type: string) =>
  effectDefinitions.find((item) => item.type === type);

export function effectSeeds(count: number) {
  return Array.from(
    { length: Math.max(1, Math.min(80, Math.round(count))) },
    (_, index) => ({
      x: (index * 37 + 13) % 100,
      y: (index * 61 + 29) % 100,
      delay: -((index * 17) % 100) / 100,
      scale: 0.55 + ((index * 23) % 70) / 100,
      drift: ((index * 41) % 100) - 50,
    }),
  );
}
