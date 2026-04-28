import React from 'react';
import { Rule } from '../types';

type RuleItemProps = {
  rule: Rule;
  onToggle: (rule: Rule) => void;
  onEdit: (rule: Rule) => void;
  onDelete: (rule: Rule) => void;
};

function describeRule(rule: Rule): string {
  if (rule.type === 'forbidden') {
    const preview = rule.strings.slice(0, 3).join(', ');
    const more = rule.strings.length > 3 ? `, +${rule.strings.length - 3} more` : '';
    const caseNote = rule.caseSensitive ? '' : ' (case-insensitive)';
    return `Forbidden: ${preview}${more}${caseNote}`;
  }
  if (rule.type === 'length') {
    return `Flags lines longer than ${rule.maxLength} characters`;
  }
  const invertNote = rule.invert ? ' (inverted)' : '';
  return `Regex: /${rule.pattern}/${rule.flags}${invertNote}`;
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, onToggle, onEdit, onDelete }) => {
  return (
    <div className={`rule-item ${rule.enabled ? '' : 'disabled'}`}>
      <label className="toggle" title={rule.enabled ? 'Enabled' : 'Disabled'}>
        <input
          type="checkbox"
          checked={rule.enabled}
          onChange={() => onToggle(rule)}
          aria-label={`Toggle ${rule.name}`}
        />
        <span className="slider" />
      </label>

      <div className="rule-item-body">
        <div className="rule-item-name">{rule.name}</div>
        <div className="rule-item-message">{rule.message}</div>
        <div className="rule-item-detail">{describeRule(rule)}</div>
      </div>

      <div className="rule-item-actions">
        <button
          className="icon-button"
          onClick={() => onEdit(rule)}
          title="Edit"
          aria-label="Edit rule"
        >
          ✏️
        </button>
        <button
          className="icon-button danger"
          onClick={() => onDelete(rule)}
          title="Delete"
          aria-label="Delete rule"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default RuleItem;
