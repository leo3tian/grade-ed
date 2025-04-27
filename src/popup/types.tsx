export type View = 
| { name: 'home' }
| { name: 'library', libraryName: string }
| { name: 'settings' };


export type Library = {
    name: string;          
    description: string;   
    enabled: boolean;
    deductions: string[]; 
  };
  