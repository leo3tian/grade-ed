import { Rule } from '../types';

const STORAGE_KEY = 'linterRules';

// Default rules seeded the first time storage is read with no rules present.
// Showcases the two most common types — a length rule and a forbidden-strings
// rule. Existing users with the older regex-based break default keep theirs.
export const DEFAULT_RULES: Rule[] = [
  {
    id: 'default-long-lines',
    name: 'Long lines',
    message: 'Line exceeds 100 characters.',
    enabled: true,
    type: 'length',
    maxLength: 100,
  },
  {
    id: 'default-forbidden-break',
    name: "Forbidden 'break'",
    message: "Use of 'break' is forbidden.",
    enabled: true,
    type: 'forbidden',
    strings: ['break'],
    caseSensitive: true,
  },
];

export function generateRuleId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Validates the runtime shape of a stored rule. Anything failing this gets
// dropped on load — defensive against corrupted storage and old formats.
export function isRule(value: unknown): value is Rule {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as { [k: string]: unknown };
  if (
    typeof r.id !== 'string' ||
    typeof r.name !== 'string' ||
    typeof r.message !== 'string' ||
    typeof r.enabled !== 'boolean'
  ) {
    return false;
  }
  if (r.type === 'forbidden') {
    return (
      Array.isArray(r.strings) &&
      r.strings.every((s) => typeof s === 'string') &&
      typeof r.caseSensitive === 'boolean'
    );
  }
  if (r.type === 'length') {
    return typeof r.maxLength === 'number' && Number.isFinite(r.maxLength);
  }
  if (r.type === 'regex') {
    return typeof r.pattern === 'string' && typeof r.flags === 'string';
  }
  return false;
}

// Reads rules from chrome.storage.local. If nothing is stored yet (first run
// after this feature shipped), seeds DEFAULT_RULES and returns them so the
// linter has the same behavior as before the rule system existed.
export async function loadRules(): Promise<Rule[]> {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const stored = data[STORAGE_KEY];
  if (!Array.isArray(stored)) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_RULES });
    return [...DEFAULT_RULES];
  }
  return stored.filter(isRule);
}

export function saveRules(rules: Rule[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: rules }, () => resolve());
  });
}

export async function upsertRule(rule: Rule): Promise<Rule[]> {
  const rules = await loadRules();
  const idx = rules.findIndex((r) => r.id === rule.id);
  const next = [...rules];
  if (idx === -1) next.push(rule);
  else next[idx] = rule;
  await saveRules(next);
  return next;
}

export async function deleteRule(id: string): Promise<Rule[]> {
  const rules = await loadRules();
  const next = rules.filter((r) => r.id !== id);
  await saveRules(next);
  return next;
}

// Applies one rule to one line. Returns the rule's message if the line
// should be flagged, or null if the rule passes / is disabled / errors out.
export function evaluateRule(rule: Rule, line: string): string | null {
  if (!rule.enabled) return null;

  if (rule.type === 'forbidden') {
    const haystack = rule.caseSensitive ? line : line.toLowerCase();
    for (const s of rule.strings) {
      if (!s) continue;
      const needle = rule.caseSensitive ? s : s.toLowerCase();
      if (haystack.includes(needle)) return rule.message;
    }
    return null;
  }

  if (rule.type === 'length') {
    return line.length > rule.maxLength ? rule.message : null;
  }

  // regex — guard against invalid patterns so one broken rule doesn't
  // break the whole linter run.
  let re: RegExp;
  try {
    re = new RegExp(rule.pattern, rule.flags);
  } catch {
    return null;
  }
  const matched = re.test(line);
  const triggers = rule.invert ? !matched : matched;
  return triggers ? rule.message : null;
}

export type LineIssue = { line: number; messages: string[] };

// Runs every rule against every line. Returns one entry per line with at
// least one triggering rule, with all triggered messages collected.
export function lintCode(code: string, rules: Rule[]): LineIssue[] {
  const lines = code.split('\n');
  const out: LineIssue[] = [];
  for (let i = 0; i < lines.length; i++) {
    const content = lines[i].replace(/^\d+\s+/, '');
    const messages: string[] = [];
    for (const rule of rules) {
      const msg = evaluateRule(rule, content);
      if (msg) messages.push(msg);
    }
    if (messages.length > 0) out.push({ line: i + 1, messages });
  }
  return out;
}
