export type View =
  | { name: 'home' }
  | { name: 'library'; libraryName: string }
  | { name: 'rules' }
  | { name: 'settings' };

export type Library = {
  name: string;
  description: string;
  enabled: boolean;
  deductions: string[];
};

// A linter rule is a structured predicate. If it triggers on a line, that
// line is flagged with `message`. We keep the shape JSON-serializable so
// rules can be stored, imported, and exported without `eval`.
type RuleBase = {
  id: string;
  name: string;
  message: string;
  enabled: boolean;
};

// "Forbidden" — the common case: flag a line if it contains any of the
// listed substrings. Matches anywhere in the line (no word-boundary magic);
// power users who need precision drop into the regex type.
export type ForbiddenRule = RuleBase & {
  type: 'forbidden';
  strings: string[];
  caseSensitive: boolean;
};

export type LengthRule = RuleBase & {
  type: 'length';
  maxLength: number;
};

// Escape hatch for anything the structured types can't express.
export type RegexRule = RuleBase & {
  type: 'regex';
  pattern: string;
  flags: string;
  // If true, flag the line when the pattern does NOT match.
  invert?: boolean;
};

export type Rule = ForbiddenRule | LengthRule | RegexRule;
