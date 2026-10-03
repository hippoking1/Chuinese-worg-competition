import * as fs from 'fs';
import * as path from 'path';

interface Question {
  id: string;
  type: string;
  year: number;
  level: string;
  no: number;
  context: string;
  target: number;
  char: string;
  zhuyin: string;
  alt_answers?: string;
  tags?: string;
  enabled: boolean;
}

const jsonPath = path.resolve('public/questions.json');
const raw = fs.readFileSync(jsonPath, 'utf-8');
const questions: Question[] = JSON.parse(raw);

console.log(`Checking ${questions.length} questions...`);

const ids = new Set<string>();
const BPMF_REGEX = /^˙?[ㄅ-ㄩ]{1,3}[ˊˇˋ]?$/u;

let errors = 0;

for (const q of questions) {
  // Check duplicate ID
  if (ids.has(q.id)) {
    console.error(`[Error] Duplicate ID found: ${q.id}`);
    errors++;
  }
  ids.add(q.id);

  // Check type
  if (q.type !== 'sound' && q.type !== 'form') {
    console.error(`[Error] Invalid question type in ${q.id}: ${q.type}`);
    errors++;
  }

  // Check year
  if (q.year !== 113 && q.year !== 114) {
    console.error(`[Error] Unexpected year in ${q.id}: ${q.year}`);
    errors++;
  }

  // Check context and target char matching
  const ctxArray = Array.from(q.context);
  if (q.target < 0 || q.target >= ctxArray.length) {
    console.error(`[Error] Target index out of range in ${q.id}: target=${q.target}, context length=${ctxArray.length}`);
    errors++;
  } else if (ctxArray[q.target] !== q.char) {
    console.error(`[Error] Char mismatch in ${q.id}: context[${q.target}]='${ctxArray[q.target]}' != char='${q.char}'`);
    errors++;
  }

  // Check Zhuyin regex
  if (!BPMF_REGEX.test(q.zhuyin)) {
    console.error(`[Error] Invalid Zhuyin format in ${q.id}: '${q.zhuyin}'`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`Validation failed with ${errors} error(s)!`);
  process.exit(1);
} else {
  console.log(`All ${questions.length} questions validated successfully! 100% compliant with standard.`);
}
