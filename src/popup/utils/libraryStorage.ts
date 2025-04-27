// src/utils/libraryStorage.ts

import { Library } from '../types';

// Helper method to validate if an object is a Library
export function isLibrary(obj: unknown): obj is Library {
  if (typeof obj !== 'object' || obj === null) return false;
  const maybeLib = obj as { [key: string]: unknown };
  return (
    typeof maybeLib.name === 'string' &&
    typeof maybeLib.description === 'string' &&
    typeof maybeLib.enabled === 'boolean' &&
    Array.isArray(maybeLib.deductions)
  );
}

// Helper method that returns whether or not newName would overwrite an existing library
export function willOverwriteLibrary(
  libraries: { [name: string]: Library },
  newName: string,
  oldName?: string
): boolean {
  const trimmedName = newName.trim();
  if (!trimmedName) return false;
  return libraries.hasOwnProperty(trimmedName) && trimmedName !== oldName;
}

// Load all libraries from storage
export function loadLibraries(): Promise<{ [name: string]: Library }> {
  return new Promise((resolve) => {
    chrome.storage.local.get({ libraries: {} }, (data) => {
      resolve(data.libraries || {});
    });
  });
}

// Save all libraries back to storage
export function saveLibraries(libraries: { [name: string]: Library }): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ libraries }, () => resolve());
  });
}

// Update a single library, with rename support
export async function updateLibrary(
  oldKey: string,
  updates: Partial<Library>,
  onSuccess?: () => void
): Promise<{ [name: string]: Library }> {
  const currentLibraries = await loadLibraries();
  const currentLibrary = currentLibraries[oldKey];

  if (!currentLibrary) {
    console.warn(`Library '${oldKey}' not found.`);
    return currentLibraries;
  }

  const newName = updates.name?.trim();
  const isNameChanging = newName && newName !== currentLibrary.name;
  let updatedLibraries = { ...currentLibraries };

  if (isNameChanging) {
    if (willOverwriteLibrary(currentLibraries, newName, oldKey)) {
      const confirmOverwrite = window.confirm(`A library named "${newName}" already exists. Overwrite it?`);
      if (!confirmOverwrite) {
        console.log('Rename cancelled by user.');
        return currentLibraries;
      }
    }

    const updatedLibrary = { ...currentLibrary, ...updates };
    delete updatedLibraries[oldKey];
    updatedLibraries[newName] = updatedLibrary;
  } else {
    updatedLibraries[oldKey] = { ...currentLibrary, ...updates };
  }

  await saveLibraries(updatedLibraries);
  // Runs callback function
  onSuccess?.();
  return updatedLibraries;
}

// Delete a library
export async function deleteLibrary(libraryKey: string): Promise<{ [name: string]: Library }> {
    const currentLibraries = await loadLibraries();
    if (!currentLibraries[libraryKey]) {
    console.warn(`Library '${libraryKey}' not found.`);
    return currentLibraries;
    }

    const updatedLibraries = { ...currentLibraries };
    delete updatedLibraries[libraryKey];

    await saveLibraries(updatedLibraries);
    return updatedLibraries;
}

// Import a full set of libraries (with optional overwrite confirmation)
export async function importLibraries(imported: { [name: string]: Library }): Promise<{ success: boolean }> {
  const existingLibraries = await loadLibraries();

  const overwrites = Object.keys(imported).filter((key) => willOverwriteLibrary(existingLibraries, key));
  if (overwrites.length > 0) {
    const confirmOverwrite = window.confirm(`Importing will overwrite ${overwrites.length} existing libraries. Continue?`);
    if (!confirmOverwrite) return { success: false };
  }

  await saveLibraries(imported);
  return { success: true };
}
