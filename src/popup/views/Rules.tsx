import React, { useEffect, useState } from 'react';
import { Rule } from '../types';
import RuleItem from '../components/RuleItem';
import RuleModal from '../components/RuleModal';
import { deleteRule, loadRules, upsertRule } from '../utils/rules';

type RulesProps = {
  goBack: () => void;
};

const Rules: React.FC<RulesProps> = ({ goBack }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRules().then((r) => {
      setRules(r);
      setLoading(false);
    });
  }, []);

  const refresh = async () => {
    const next = await loadRules();
    setRules(next);
  };

  const handleSave = async (rule: Rule) => {
    const next = await upsertRule(rule);
    setRules(next);
    setEditing(null);
    setCreating(false);
  };

  const handleToggle = async (rule: Rule) => {
    const next = await upsertRule({ ...rule, enabled: !rule.enabled });
    setRules(next);
  };

  const handleDelete = async (rule: Rule) => {
    const ok = window.confirm(`Delete rule "${rule.name}"?`);
    if (!ok) return;
    const next = await deleteRule(rule.id);
    setRules(next);
  };

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
  };

  const showModal = creating || editing !== null;

  return (
    <>
      <div className="details-header-bar">
        <div className="details-title">
          <div className="details-title-eyebrow">Linter</div>
          <div className="details-title-name">Rules</div>
        </div>
        <button className="secondary-button" onClick={goBack}>
          ← Back
        </button>
      </div>

      <div className="button-row">
        <button
          className="primary-button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          ➕ New Rule
        </button>
      </div>

      <div className="section-header">
        <span>Rules</span>
        <span className="section-count">{rules.length}</span>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <div className="empty-title">Loading…</div>
        </div>
      ) : rules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📏</div>
          <div className="empty-title">No rules yet</div>
          <div className="empty-subtitle">
            Click "➕ New Rule" to create your first one.
          </div>
        </div>
      ) : (
        <div className="rule-list">
          {rules.map((rule) => (
            <RuleItem
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <RuleModal
          initialRule={editing}
          onSave={handleSave}
          onCancel={closeModal}
        />
      )}
    </>
  );
};

export default Rules;
