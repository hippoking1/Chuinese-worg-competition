import type { Ink, Point, Stroke } from '../types';

export function getStrokeBoundingBox(stroke: Stroke) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const pt of stroke) {
    if (pt[0] < minX) minX = pt[0];
    if (pt[1] < minY) minY = pt[1];
    if (pt[0] > maxX) maxX = pt[0];
    if (pt[1] > maxY) maxY = pt[1];
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function getInkBoundingBox(ink: Ink) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const stroke of ink) {
    for (const pt of stroke) {
      if (pt[0] < minX) minX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] > maxY) maxY = pt[1];
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Render stroke with smooth quadratic bezier curves
 */
export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, color = '#2D3748', baseWidth = 4) {
  if (stroke.length === 0) return;
  
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (stroke.length === 1) {
    const [x, y] = stroke[0];
    ctx.beginPath();
    ctx.arc(x, y, baseWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  
  if (stroke.length === 2) {
    ctx.lineWidth = baseWidth;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    ctx.lineTo(stroke[1][0], stroke[1][1]);
    ctx.stroke();
    return;
  }
  
  ctx.lineWidth = baseWidth;
  ctx.beginPath();
  ctx.moveTo(stroke[0][0], stroke[0][1]);
  
  for (let i = 1; i < stroke.length - 1; i++) {
    const midX = (stroke[i][0] + stroke[i + 1][0]) / 2;
    const midY = (stroke[i][1] + stroke[i + 1][1]) / 2;
    ctx.quadraticCurveTo(stroke[i][0], stroke[i][1], midX, midY);
  }
  
  const last = stroke[stroke.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
}

/**
 * Draw entire ink collection onto canvas
 */
export function drawInk(ctx: CanvasRenderingContext2D, ink: Ink, color = '#2D3748', baseWidth = 4) {
  for (const stroke of ink) {
    drawStroke(ctx, stroke, color, baseWidth);
  }
}

/**
 * Export Ink to small PNG data URL for preview in review list
 */
export function inkToThumbnail(ink: Ink, width = 100, height = 100): string {
  if (!ink || ink.length === 0) return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  
  // Light grid
  ctx.strokeStyle = '#F0EDE6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
  ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
  ctx.stroke();
  
  const bbox = getInkBoundingBox(ink);
  if (bbox.width <= 0 || bbox.height <= 0) return canvas.toDataURL();
  
  const scale = Math.min((width * 0.75) / bbox.width, (height * 0.75) / bbox.height);
  const offsetX = (width - bbox.width * scale) / 2 - bbox.minX * scale;
  const offsetY = (height - bbox.height * scale) / 2 - bbox.minY * scale;
  
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  drawInk(ctx, ink, '#2D3748', 3 / scale);
  ctx.restore();
  
  return canvas.toDataURL();
}
