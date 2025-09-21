import { useState, useCallback } from 'react';
import { 
  extractWordContent, 
  compareWordDocuments, 
  isValidWordFile,
  WordDocument, 
  ComparisonResult 
} from '@/lib/wordUtils';

interface UseWordProcessorState {
  documents: WordDocument[];
  comparisonResult: ComparisonResult | null;
  isProcessing: boolean;
  error: string | null;
}

export function useWordProcessor() {
  const [state, setState] = useState<UseWordProcessorState>({
    documents: [],
    comparisonResult: null,
    isProcessing: false,
    error: null
  });

  const addDocument = useCallback(async (file: File) => {
    if (!isValidWordFile(file)) {
      setState(prev => ({
        ...prev,
        error: `Invalid file type. Please select a .docx file. (${file.name})`
      }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const document = await extractWordContent(file);
      
      setState(prev => {
        const newDocuments = [...prev.documents, document];
        return {
          ...prev,
          documents: newDocuments,
          isProcessing: false,
          error: null
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process document'
      }));
    }
  }, []);

  const addMultipleDocuments = useCallback(async (files: File[]) => {
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const validFiles = files.filter(file => {
        if (!isValidWordFile(file)) {
          console.warn(`Skipping invalid file: ${file.name}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        throw new Error('No valid Word documents found. Please select .docx files.');
      }

      const documentPromises = validFiles.map(file => extractWordContent(file));
      const newDocuments = await Promise.all(documentPromises);

      setState(prev => ({
        ...prev,
        documents: [...prev.documents, ...newDocuments],
        isProcessing: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process documents'
      }));
    }
  }, []);

  const removeDocument = useCallback((filename: string) => {
    setState(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.filename !== filename),
      comparisonResult: null
    }));
  }, []);

  const clearDocuments = useCallback(() => {
    setState({
      documents: [],
      comparisonResult: null,
      isProcessing: false,
      error: null
    });
  }, []);

  const compareDocuments = useCallback(() => {
    if (state.documents.length < 2) {
      setState(prev => ({
        ...prev,
        error: 'At least 2 documents are required for comparison'
      }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = compareWordDocuments(state.documents);
      
      setState(prev => ({
        ...prev,
        comparisonResult: result,
        isProcessing: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to compare documents'
      }));
    }
  }, [state.documents]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    addDocument,
    addMultipleDocuments,
    removeDocument,
    clearDocuments,
    compareDocuments,
    clearError,
    canCompare: state.documents.length >= 2
  };
}