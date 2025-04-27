import React, { useEffect, useState, useRef } from 'react';
import { View } from '../types';
import DeductionItem from '../components/DeductionItem';

type LibraryDetailProps = {
  libraryName: string;
};

const LibraryDetail: React.FC<LibraryDetailProps> = ({ libraryName}) => {
  const [deductions, setDeductions] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chrome.storage.local.get({ libraries: {} }, (data) => {
      const lib = data.libraries[libraryName] || [];
      setDeductions(lib);
    });
  }, [libraryName]);

  const saveDeductions = (updated: string[]) => {
    chrome.storage.local.get({ libraries: {} }, (data) => {
      const updatedLibraries = { ...data.libraries, [libraryName]: updated };
      chrome.storage.local.set({ libraries: updatedLibraries }, () => {
        setDeductions(updated);
      });
    });
  };

  const handleAdd = () => {
    const newText = inputRef.current?.value.trim();
    if (!newText) return;
    saveDeductions([...deductions, newText]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    const updated = deductions.filter((_, i) => i !== index);
    saveDeductions(updated);
  };

  return (
    <>
      <div className="large">Editing {libraryName}</div>

      <textarea ref={inputRef} placeholder="Enter markdown..." />
      <button className="add-btn" onClick={handleAdd}>Add Deduction</button>

      <div className="large">Loaded Deductions</div>
      <div className="deduction-list">
        {deductions.map((markdown, index) => {
          const headerText = markdown.split('\n')[0].replaceAll('**', '');
          const bodyText = markdown;
          return (
            <DeductionItem
              key={index}
              index={index}
              title={headerText}
              body={bodyText}
              onDelete={() => handleRemove(index)}
            />
          );
        })}
      </div>
    </>
  );
};

export default LibraryDetail;

// import React, { useEffect, useState, useRef } from 'react';
// import '../../../public/popup.css';
// import DeductionItem from '../components/DeductionItem';

// type LibraryProps = {
//     libraryName: string;
// }

// const Library: React.FC<LibraryProps> = ({ libraryName }) => {
//   const [deductions, setDeductions] = useState<string[]>([]);
//   const inputRef = useRef<HTMLTextAreaElement>(null);
//   const importInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     chrome.storage.local.get({ customDeductions: [] }, (data) => {
//       setDeductions(data.customDeductions);
//     });
//   }, []);

//   const handleAdd = () => {
//     const newText = inputRef.current?.value.trim();
//     if (!newText) return;

//     const updated = [...deductions, newText];
//     chrome.storage.local.set({ customDeductions: updated }, () => {
//       setDeductions(updated);
//       if (inputRef.current) inputRef.current.value = '';
//     });
//   };

//   const handleRemove = (index: number) => {
//     const updated = deductions.filter((_, i) => i !== index);
//     chrome.storage.local.set({ customDeductions: updated }, () => {
//       setDeductions(updated);
//     });
//   };

//   const handleExport = () => {
//       chrome.storage.local.get({ customDeductions: [] }, (data) => {
//       const blob = new Blob([JSON.stringify(data.customDeductions, null, 2)], { type: 'application/json' });
//       const url = URL.createObjectURL(blob);

//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'deductions.json';
//       a.click();

//       URL.revokeObjectURL(url);
//       });
//   };

//   const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
//       const file = e.target.files?.[0];
//       if (!file) return;

//       const reader = new FileReader();
//       reader.onload = () => {
//       try {
//           const imported = JSON.parse(reader.result as string);
//           if (Array.isArray(imported)) {
//           chrome.storage.local.set({ customDeductions: imported }, () => {
//               setDeductions(imported);
//           });
//           } else {
//           alert('Invalid format. Expected an array of markdown strings.');
//           }
//       } catch {
//           alert('Failed to parse JSON file.');
//       }
//       };
//       reader.readAsText(file);
//   };


//   return (
//     <>
//         <div className="button-group">
//         <button onClick={handleExport}>Export</button>
//         <button
//             className="import-label"
//             onClick={() => importInputRef.current?.click()}
//         >
//             Import
//         </button>
//         <input
//             type="file"
//             id="importInput"
//             ref={importInputRef}
//             style={{ display: 'none' }}
//             onChange={handleImport}
//         />
//         </div>
        
//         <div className="large">Editing {libraryName} Library</div>
//         <textarea ref={inputRef} placeholder="Enter markdown..." />
//         <button className="add-btn" onClick={handleAdd}>Add Deduction</button>
//         <div className="large">Loaded Deductions</div>
//         <div className="deduction-list">
//             {deductions.map((markdown, index) => {
//                 const headerText = markdown.split('\n')[0].replaceAll('**', '');
//                 const bodyText = markdown;
//                 return <DeductionItem
//                 key={index}
//                 index={index}
//                 title={headerText}
//                 body={bodyText}
//                 onDelete={() => handleRemove(index)}
//                 />;
//             })}
//         </div>
//     </>
//   );
// };

// export default Library;
