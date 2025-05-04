import { useState } from "react";
import '../../../public/popup.css';

type DeductionItemProps = {
    index: number,
    title: string,
    body: string,
    onDelete: (index: number) => void,
}

const DeductionItem: React.FC<DeductionItemProps> = ({ index, title, body, onDelete }) => {
    const [showDeduction, setShowDeduction] = useState<boolean>(false);

    return (
        <div className={`deduction-container ${showDeduction ? 'expanded' : ''}`}> 
            <div className="deduction-header" onClick={() => setShowDeduction(!showDeduction)}>
                <div className="deduction-title">
                    <span className="deduction-chevron">{showDeduction ? '⌄' : '›'}</span>
                    {title}
                </div>
                <button 
                    className="deduction-remove-button" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(index);
                    }}
                    title="Remove"
                >
                    🗑️
                </button>
            </div>
            <div className="deduction-body-wrapper">
                {showDeduction && (
                    <div className="deduction-body">
                        {body}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DeductionItem;
