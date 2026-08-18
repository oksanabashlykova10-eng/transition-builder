import type { CSSProperties } from "react";
import type { BuiltInEffectLayer } from "../../project/model/project";
import { effectSeeds } from "./effectRegistry";
import "./effects.css";

export function BuiltInEffect({ layer }: { layer: BuiltInEffectLayer }) {
  const settings = layer.settings;
  const seeds = effectSeeds(Number(settings.count ?? 20));
  return (
    <div
      className={`tb-built-effect tb-effect-${layer.effectType}`}
      style={
        {
          "--effect-primary": settings.primaryColor,
          "--effect-secondary": settings.secondaryColor,
          "--effect-speed": `${settings.speed ?? 2}s`,
          "--effect-size": `${settings.size ?? 10}px`,
          "--effect-intensity": settings.intensity ?? 1,
          "--effect-count": seeds.length,
        } as CSSProperties
      }
    >
      {seeds.map((seed, index) => (
        <i
          key={index}
          style={
            {
              "--x": `${seed.x}%`,
              "--y": `${seed.y}%`,
              "--delay": seed.delay,
              "--scale": seed.scale,
              "--drift": `${seed.drift}px`,
              "--index": index,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
