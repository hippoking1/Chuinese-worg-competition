import type { Ink, Stroke } from '../../types';
import { getInkBoundingBox } from '../ink';

export function classifyTone(ink: Ink, boxWidth: number, boxHeight: number): 1 | 2 | 3 | 4 | 0 {
  if (!ink || ink.length === 0) {
    return 1; // 1st tone (no tone mark)
  }

  const firstStroke = ink[0];
  if (!firstStroke || firstStroke.length === 0) return 1;

  const bbox = getInkBoundingBox(ink);
  const strokeLen = pathLength(firstStroke);

  // Check for neutral tone dot (˙): small dot with length < 18% of area height
  if (ink.length === 1 && (strokeLen < boxHeight * 0.20 || (bbox.width < boxWidth * 0.25 && bbox.height < boxHeight * 0.25))) {
    return 0; // neutral tone
  }

  // Check for V-shape (ˇ 3rd tone)
  if (hasVShape(firstStroke)) {
    return 3;
  }

  // Check direction from start to end of stroke
  const start = firstStroke[0];
  const end = firstStroke[firstStroke.length - 1];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];

  // Upward right: ˊ (2nd tone)
  if (dy < 0) {
    return 2;
  }

  // Downward right: ˋ (4th tone)
  if (dy > 0) {
    return 4;
  }

  return 1;
}

function pathLength(stroke: Stroke): number {
  let len = 0;
  for (let i = 1; i < stroke.length; i++) {
    const dx = stroke[i][0] - stroke[i - 1][0];
    const dy = stroke[i][1] - stroke[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function hasVShape(stroke: Stroke): boolean {
  if (stroke.length < 5) return false;
  // Look for minimum y in the middle third (valley)
  let minY = Infinity;
  let minIdx = -1;
  for (let i = 0; i < stroke.length; i++) {
    if (stroke[i][1] > minY) {
      // In canvas, y goes down, so maximum y coordinate is the lowest point (the bottom of the V)
    }
  }

  let maxY = -Infinity;
  let maxIdx = -1;
  for (let i = 0; i < stroke.length; i++) {
    if (stroke[i][1] > maxY) {
      maxY = stroke[i][1];
      maxIdx = i;
    }
  }

  // Bottom point is in middle range (between 20% and 80% of points)
  if (maxIdx > stroke.length * 0.2 && maxIdx < stroke.length * 0.8) {
    const startY = stroke[0][1];
    const endY = stroke[stroke.length - 1][1];
    const drop = maxY - startY;
    const rise = maxY - endY;
    if (drop > 10 && rise > 10) {
      return true;
    }
  }

  return false;
}
