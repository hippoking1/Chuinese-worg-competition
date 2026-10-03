/**
 * $P Point-Cloud Recognizer (Vatavu, Anthony, Wobbrock 2012)
 * Recognizes multi-stroke gestures as 2D point clouds, invariant to stroke order and count.
 */

export interface PPoint {
  x: number;
  y: number;
  strokeId: number;
}

export interface PTemplate {
  name: string;
  points: PPoint[];
}

const NUM_POINTS = 32;

function resample(points: PPoint[], n: number): PPoint[] {
  const newPoints: PPoint[] = [points[0]];
  let I = pathLength(points) / (n - 1);
  let D = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].strokeId === points[i - 1].strokeId) {
      const d = dist(points[i - 1], points[i]);
      if (D + d >= I) {
        const qx = points[i - 1].x + ((I - D) / d) * (points[i].x - points[i - 1].x);
        const qy = points[i - 1].y + ((I - D) / d) * (points[i].y - points[i - 1].y);
        const q: PPoint = { x: qx, y: qy, strokeId: points[i].strokeId };
        newPoints.push(q);
        points.splice(i, 0, q);
        D = 0;
      } else {
        D += d;
      }
    }
  }
  while (newPoints.length < n) {
    newPoints.push({ ...points[points.length - 1] });
  }
  return newPoints;
}

function scale(points: PPoint[]): PPoint[] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const size = Math.max(maxX - minX, maxY - minY, 1);
  return points.map(p => ({
    x: (p.x - minX) / size,
    y: (p.y - minY) / size,
    strokeId: p.strokeId
  }));
}

function translateTo(points: PPoint[], pt: { x: number; y: number }): PPoint[] {
  const c = centroid(points);
  return points.map(p => ({
    x: p.x + pt.x - c.x,
    y: p.y + pt.y - c.y,
    strokeId: p.strokeId
  }));
}

function centroid(points: PPoint[]): { x: number; y: number } {
  let x = 0, y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

function pathLength(points: PPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].strokeId === points[i - 1].strokeId) {
      d += dist(points[i - 1], points[i]);
    }
  }
  return d;
}

function dist(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function cloudDistance(pts1: PPoint[], pts2: PPoint[], startIdx: number): number {
  const matched = new Array(pts1.length).fill(false);
  let sum = 0;
  let i = startIdx;
  do {
    let min = Infinity;
    let index = -1;
    for (let j = 0; j < pts2.length; j++) {
      if (!matched[j]) {
        const d = dist(pts1[i], pts2[j]);
        if (d < min) {
          min = d;
          index = j;
        }
      }
    }
    matched[index] = true;
    const weight = 1 - ((i - startIdx + pts1.length) % pts1.length) / pts1.length;
    sum += weight * min;
    i = (i + 1) % pts1.length;
  } while (i !== startIdx);
  return sum;
}

function greedyCloudMatch(pts1: PPoint[], pts2: PPoint[]): number {
  const e = 0.5;
  const step = Math.floor(Math.pow(pts1.length, 1 - e));
  let min = Infinity;
  for (let i = 0; i < pts1.length; i += step) {
    const d1 = cloudDistance(pts1, pts2, i);
    const d2 = cloudDistance(pts2, pts1, i);
    min = Math.min(min, Math.min(d1, d2));
  }
  return min;
}

export function normalizePointcloud(rawPoints: PPoint[]): PPoint[] {
  if (rawPoints.length === 0) return [];
  const res = resample(rawPoints, NUM_POINTS);
  const sc = scale(res);
  return translateTo(sc, { x: 0, y: 0 });
}

export function recognizePointcloud(points: PPoint[], templates: PTemplate[]): { name: string; score: number }[] {
  if (points.length < 2 || templates.length === 0) return [];
  const candidate = normalizePointcloud(points);
  
  const results: { name: string; score: number }[] = [];
  for (const template of templates) {
    const d = greedyCloudMatch(candidate, template.points);
    const score = Math.max((2.0 - d) / 2.0, 0);
    results.push({ name: template.name, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
