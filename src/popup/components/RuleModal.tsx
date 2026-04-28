import React, { useEffect, useState } from 'react';
import { ForbiddenRule, LengthRule, RegexRule, Rule } from '../types';
import { generateRuleId } from '../utils/rules';

type RuleModalProps = {
  initialRule: Rule | null;
  onSave: (rule: Rule) => void;
  onCancel: () => void;
};

type RuleType = Rule['type'];

const DEFAULT_LENGTH = 100;

// Forbidden-strings input is one entry per line; that keeps the UI simple
// (no tag chips, no escaping) and lets users paste lists from elsewhere.
function joinStrings(strings: string[]): string {
  return strings.join('\n');
}
function splitStrings(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
}

const RuleModal: React.FC<RuleModalProps> = ({ initialRule, onSave, onCancel }) => {
  const isEditing = initialRule !== null;

  const [name, setName] = useState(initialRule?.name ?? '');
  const [message, setMessage] = useState(initialRule?.message ?? '');
  const [enabled, setEnabled] = useState(initialRule?.enabled ?? true);
  // New rules default to 'forbidden' since that covers ~90% of grading checks.
  const [type, setType] = useState<RuleType>(initialRule?.type ?? 'forbidden');

  // Forbidden-rule state.
  const [stringsText, setStringsText] = useState(
    initialRule?.type === 'forbidden' ? joinStrings(initialRule.strings) : '',
  );
  const [caseSensitive, setCaseSensitive] = useState<boolean>(
    initialRule?.type === 'forbidden' ? initialRule.caseSensitive : true,
  );

  // Length-rule state.
  const [maxLength, setMaxLength] = useState<number>(
    initialRule?.type === 'length' ? initialRule.maxLength : DEFAULT_LENGTH,
  );

  // Regex-rule state.
  const [pattern, setPattern] = useState(
    initialRule?.type === 'regex' ? initialRule.pattern : '',
  );
  const [flags, setFlags] = useState(
    initialRule?.type === 'regex' ? initialRule.flags : '',
  );
  const [invert, setInvert] = useState<boolean>(
    initialRule?.type === 'regex' ? Boolean(initialRule.invert) : false,
  );

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [
    name,
    message,
    type,
    stringsText,
    caseSensitive,
    maxLength,
    pattern,
    flags,
    invert,
  ]);

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName) return setError('Name is required.');
    if (!trimmedMessage) return setError('Message is required.');

    const baseId = initialRule?.id ?? generateRuleId();
    const base = {
      id: baseId,
      name: trimmedName,
      message: trimmedMessage,
      enabled,
    };

    if (type === 'forbidden') {
      const strings = splitStrings(stringsText);
      if (strings.length === 0) {
        return setError('Add at least one forbidden string.');
      }
      const rule: ForbiddenRule = {
        ...base,
        type: 'forbidden',
        strings,
        caseSensitive,
      };
      onSave(rule);
      return;
    }

    if (type === 'length') {
      if (!Number.isFinite(maxLength) || maxLength < 1) {
        return setError('Max length must be a positive integer.');
      }
      const rule: LengthRule = {
        ...base,
        type: 'length',
        maxLength: Math.floor(maxLength),
      };
      onSave(rule);
      return;
    }

    // regex
    if (!pattern) return setError('Pattern is required.');
    try {
      new RegExp(pattern, flags);
    } catch (e) {
      return setError(
        `Invalid regex: ${e instanceof Error ? e.message : 'unknown error'}`,
      );
    }
    const rule: RegexRule = {
      ...base,
      type: 'regex',
      pattern,
      flags,
      invert,
    };
    onSave(rule);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave();
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <h2>{isEditing ? '✏️ Edit Rule' : '✨ New Rule'}</h2>

        <div className="modal-field">
          <label>Name</label>
          <input
            type="text"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. No flow control"
          />
        </div>

        <div className="modal-field">
          <label>Trigger message</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Shown on hover when a line is flagged"
          />
        </div>

        <div className="modal-field">
          <label>Rule type</label>
          <div className="radio-row">
            <label className="radio-option">
              <input
                type="radio"
                name="rule-type"
                checked={type === 'forbidden'}
                onChange={() => setType('forbidden')}
              />
              Forbidden
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="rule-type"
                checked={type === 'length'}
                onChange={() => setType('length')}
              />
              Max length
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="rule-type"
                checked={type === 'regex'}
                onChange={() => setType('regex')}
              />
              Regex
            </label>
          </div>
        </div>

        {type === 'forbidden' && (
          <>
            <div className="modal-field">
              <label>Forbidden strings (one per line)</label>
              <textarea
                value={stringsText}
                onChange={(e) => setStringsText(e.target.value)}
                placeholder={'break\ncontinue\nSystem.exit'}
                style={{
                  fontFamily:
                    "'JetBrains Mono', ui-monospace, Menlo, monospace",
                  minHeight: 90,
                }}
              />
            </div>
            <div className="modal-field modal-field-inline">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                />
                Case-sensitive
              </label>
            </div>
            <div className="modal-hint">
              Substring match — flags any line containing one of these strings.
              Need word boundaries or wildcards? Use the regex type.
            </div>
          </>
        )}

        {type === 'length' && (
          <div className="modal-field">
            <label>Max characters</label>
            <input
              type="number"
              min={1}
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
            />
          </div>
        )}

        {type === 'regex' && (
          <>
            <div className="modal-field">
              <label>Pattern</label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="\bbreak\b"
                style={{
                  fontFamily:
                    "'JetBrains Mono', ui-monospace, Menlo, monospace",
                }}
              />
            </div>
            <div className="modal-field">
              <label>Flags (optional)</label>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="e.g. i for case-insensitive"
                style={{
                  fontFamily:
                    "'JetBrains Mono', ui-monospace, Menlo, monospace",
                }}
              />
            </div>
            <div className="modal-field modal-field-inline">
              <label className="checkbox-option">
                <input
                  type="checkbox"
                  checked={invert}
                  onChange={(e) => setInvert(e.target.checked)}
                />
                Flag when pattern does <strong>not</strong> match
              </label>
            </div>
          </>
        )}

        <div className="modal-field modal-field-inline">
          <label className="checkbox-option">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enabled
          </label>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-button" onClick={handleSave}>
            {isEditing ? '💾 Save' : '✨ Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RuleModal;
