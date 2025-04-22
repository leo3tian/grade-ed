import { useState } from "react";
import '../../../public/popup.css';

type DeductionItemProps = {
    index: number,
    title: string,
    body: string,
    onDelete: (index: number) => void,
}

const DeductionItem:React.FC<DeductionItemProps> = ({index, title, body, onDelete}) => {
    const [showDeduction, setShowDeduction] = useState<boolean>(false);

    return (
        <div className="deduction-container" onClick={() => setShowDeduction(!showDeduction)}> 
            <div className="deduction-header">
                <div className="deduction-title">{title}</div>
                <button 
                    className="deduction-remove-button" 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(index);
                    }}
                >
                    Remove
                </button>
            </div>
            {showDeduction ? (
                <p className="deduction-body">{body}</p>
            ) : null}
        </div>
    );
}

export default DeductionItem;