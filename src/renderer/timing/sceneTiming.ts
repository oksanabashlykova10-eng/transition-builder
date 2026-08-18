import type { TransitionProject } from "../../project/model/project";

const normal = "opacity:1;filter:none;transform:scale(1)";

export function sceneTimingCss(
  timing: TransitionProject["timing"],
  animationName = "tb-scene-cycle",
) {
  const settings = timing.sceneAnimation ?? {
    enter: "none" as const,
    exit: "none" as const,
    enterDuration: 0,
    exitDuration: 0,
    strength: 18,
    easing: "ease-in-out" as const,
  };
  const duration = Math.max(0.1, timing.duration);
  const enterAt = Math.min(45, (settings.enterDuration / duration) * 100);
  const exitAt = Math.max(55, 100 - (settings.exitDuration / duration) * 100);
  const enter =
    settings.enter === "fade"
      ? "opacity:0;filter:none;transform:scale(1)"
      : settings.enter === "blur"
        ? `opacity:0;filter:blur(${settings.strength}px);transform:scale(1)`
        : settings.enter === "zoom"
          ? `opacity:0;filter:none;transform:scale(${Math.max(0.2, 1 - settings.strength / 100)})`
          : normal;
  const exit =
    settings.exit === "fade"
      ? "opacity:0;filter:none;transform:scale(1)"
      : settings.exit === "blur"
        ? `opacity:0;filter:blur(${settings.strength}px);transform:scale(1)`
        : settings.exit === "zoom"
          ? `opacity:0;filter:none;transform:scale(${1 + settings.strength / 100})`
          : normal;
  return {
    css: `@keyframes ${animationName}{0%{${enter}}${enterAt}%{${normal}}${exitAt}%{${normal}}100%{${exit}}}`,
    style: {
      animationName,
      animationDuration: `${duration}s`,
      animationTimingFunction: settings.easing,
      animationIterationCount: timing.mode === "infinite" ? "infinite" : "1",
      animationFillMode: "both",
    },
  };
}

export const layerTimingCss = `
.tb-layer-life{width:100%;height:100%;display:grid;place-items:center;animation-fill-mode:both;animation-timing-function:ease-in-out}
.tb-layer-life-none{animation-name:tb-layer-none}.tb-layer-life-fade{animation-name:tb-layer-fade}.tb-layer-life-blur{animation-name:tb-layer-blur}.tb-layer-life-zoom{animation-name:tb-layer-zoom}
@keyframes tb-layer-none{0%{opacity:0}1%,100%{opacity:1}}
@keyframes tb-layer-fade{0%{opacity:0}10%,78%{opacity:1}100%{opacity:0}}
@keyframes tb-layer-blur{0%{opacity:0;filter:blur(14px)}10%,78%{opacity:1;filter:blur(0)}100%{opacity:0;filter:blur(18px)}}
@keyframes tb-layer-zoom{0%{opacity:0;transform:scale(.8)}10%,78%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.18)}}`;

export function layerTimingAnimationCss(
  layer: {
    startDelay: number;
    duration: number;
    endAnimation: "none" | "fade" | "blur" | "zoom";
  },
  project: TransitionProject["timing"],
  name: string,
) {
  const total = Math.max(0.1, project.duration);
  const start = Math.min(98, Math.max(0, (layer.startDelay / total) * 100));
  const end = Math.min(
    100,
    ((layer.startDelay + layer.duration) / total) * 100,
  );
  const outro = Math.max(
    start + 1,
    end - Math.min(18, (layer.duration / total) * 18),
  );
  const visible = "opacity:1;filter:none;transform:scale(1)";
  const hidden = "opacity:0";
  const endState =
    layer.endAnimation === "fade"
      ? hidden
      : layer.endAnimation === "blur"
        ? "opacity:0;filter:blur(18px);transform:scale(1)"
        : layer.endAnimation === "zoom"
          ? "opacity:0;filter:none;transform:scale(1.18)"
          : visible;
  const afterEnd = layer.endAnimation === "none" ? visible : endState;
  return {
    css: `@keyframes ${name}{0%,${start}%{${hidden}}${Math.min(99, start + 0.15)}%,${outro}%{${visible}}${end}%{${endState}}100%{${afterEnd}}}`,
    style: {
      animationName: name,
      animationDuration: `${total}s`,
      animationIterationCount: project.mode === "infinite" ? "infinite" : "1",
      animationTimingFunction: "ease-in-out",
      animationFillMode: "both",
    },
  };
}
