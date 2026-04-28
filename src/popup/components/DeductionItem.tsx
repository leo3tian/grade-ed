import { useState } from 'react';

type DeductionItemProps = {
    index: number;
    title: string;
    body: string;
    onDelete: (index: number) => void;
};

const DeductionItem: React.FC<DeductionItemProps> = ({ index, title, body, onDelete }) => {
    const [expanded, setExpanded] = useState<boolean>(false);

    return (
        <div className={`deduction-container ${expanded ? 'expanded' : ''}`}>
            <div className="deduction-header" onClick={() => setExpanded(!expanded)}>
                <div className="deduction-title">
                    <span className="deduction-chevron">›</span>
                    {title || <em style={{ color: 'var(--text-muted)' }}>Untitled deduction</em>}
                </div>
                <button
                    className="deduction-remove-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(index);
                    }}
                    title="Remove"
                    aria-label="Remove deduction"
                >
                    🗑️
                </button>
            </div>
            <div className="deduction-body-wrapper">
                <div className="deduction-body-inner">
                    <div className="deduction-body">{body}</div>
                </div>
            </div>
        </div>
    );
};

export default DeductionItem;
