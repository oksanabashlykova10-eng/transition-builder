import type { ImageSequenceLayer } from "../../project/model/project";
export interface SequencePoint {
  x: number;
  y: number;
}

function chaikin(points: SequencePoint[], amount: number, closed: boolean) {
  if (points.length < 3 || amount <= 0) return points;
  let result = points;
  const passes = Math.max(1, Math.round(amount / 34));
  for (let pass = 0; pass < passes; pass++) {
    const next: SequencePoint[] = closed ? [] : [result[0]];
    const limit = closed ? result.length : result.length - 1;
    for (let index = 0; index < limit; index++) {
      const a = result[index],
        b = result[(index + 1) % result.length];
      next.push(
        { x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 },
        { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 },
      );
    }
    if (!closed) next.push(result.at(-1)!);
    result = next;
  }
  return result;
}
export function smoothCustomPoints(layer: ImageSequenceLayer) {
  let points = chaikin(
    layer.pathSettings.customPoints,
    layer.pathSettings.smooth,
    layer.pathSettings.closed,
  );
  if (layer.pathSettings.reverse) points = [...points].reverse();
  if (layer.pathSettings.closed && points.length > 1)
    points = [...points, points[0]];
  return points;
}
function distributeOnPolyline(points: SequencePoint[], count: number) {
  if (!points.length) return [];
  if (points.length === 1)
    return Array.from({ length: count }, () => points[0]);
  const lengths: number[] = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(
          points[i].x - points[i - 1].x,
          points[i].y - points[i - 1].y,
        ),
    );
  const total = lengths.at(-1)!;
  return Array.from({ length: count }, (_, index) => {
    const target = count === 1 ? total / 2 : (index / (count - 1)) * total;
    let segment = 1;
    while (segment < lengths.length - 1 && lengths[segment] < target) segment++;
    const start = lengths[segment - 1],
      span = lengths[segment] - start || 1,
      t = (target - start) / span,
      a = points[segment - 1],
      b = points[segment];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  });
}
export function sequencePoints(
  layer: ImageSequenceLayer,
  count: number,
): SequencePoint[] {
  if (count <= 0) return [];
  if (layer.pathType === "custom")
    return distributeOnPolyline(smoothCustomPoints(layer), count);
  const horizontalSpan = Math.min(
      layer.transform.width * 0.88,
      Math.max(0, count - 1) * (layer.imageSize + layer.spacing),
    ),
    verticalSpan = Math.min(
      layer.transform.height * 0.84,
      Math.max(0, count - 1) * (layer.imageSize + layer.spacing),
    ),
    startX = 50 - (horizontalSpan / layer.transform.width) * 50,
    startY = 50 - (verticalSpan / layer.transform.height) * 50;
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0.5 : index / (count - 1),
      x = startX + ((t * horizontalSpan) / layer.transform.width) * 100,
      y = startY + ((t * verticalSpan) / layer.transform.height) * 100;
    switch (layer.pathType) {
      case "vertical":
        return { x: 50, y };
      case "zigzag":
        return {
          x,
          y:
            50 +
            (((index % 2 ? 1 : -1) * layer.pathSettings.amplitude) /
              layer.transform.height) *
              50,
        };
      case "wave":
        return {
          x,
          y:
            50 +
            ((Math.sin(t * Math.PI * layer.pathSettings.frequency * 2) *
              layer.pathSettings.amplitude) /
              layer.transform.height) *
              50,
        };
      case "arc":
        return {
          x,
          y:
            68 -
            ((Math.sin(t * Math.PI) * layer.pathSettings.arcHeight) /
              layer.transform.height) *
              70,
        };
      case "circle": {
        const angle = -Math.PI / 2 + t * Math.PI * 2;
        return { x: 50 + Math.cos(angle) * 38, y: 50 + Math.sin(angle) * 38 };
      }
      default:
        return { x, y: 50 };
    }
  });
}
