import * as mammoth from 'mammoth';

export interface WordDocument {
  filename: string;
  content: string;
  htmlContent: string;
  wordCount: number;
  size: number;
}

export interface ComparisonResult {
  differences: TextDifference[];
  similarity: number;
  documents: WordDocument[];
}

export interface TextDifference {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  lineNumber?: number;
}

/**
 * Extract text content from a Word document file
 */
export async function extractWordContent(file: File): Promise<WordDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert to HTML and extract text
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    
    const wordCount = countWords(textResult.value);
    
    return {
      filename: file.name,
      content: textResult.value.trim(),
      htmlContent: htmlResult.value,
      wordCount,
      size: file.size
    };
  } catch (error) {
    throw new Error(`Failed to process Word document "${file.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Compare two or more Word documents
 */
export function compareWordDocuments(documents: WordDocument[]): ComparisonResult {
  if (documents.length < 2) {
    throw new Error('At least 2 documents are required for comparison');
  }

  // For now, we'll implement a simple comparison between the first two documents
  // This can be extended to support N-way comparison
  const [docA, docB, ...otherDocs] = documents;
  
  const differences = calculateTextDifferences(docA.content, docB.content);
  const similarity = calculateSimilarity(docA.content, docB.content);
  
  return {
    differences,
    similarity,
    documents
  };
}

/**
 * Calculate differences between two text strings
 */
function calculateTextDifferences(textA: string, textB: string): TextDifference[] {
  const linesA = textA.split('\n').filter(line => line.trim().length > 0);
  const linesB = textB.split('\n').filter(line => line.trim().length > 0);
  
  const differences: TextDifference[] = [];
  
  // Simple line-by-line comparison
  // This is a basic implementation - could be enhanced with proper diff algorithms
  const maxLines = Math.max(linesA.length, linesB.length);
  
  for (let i = 0; i < maxLines; i++) {
    const lineA = linesA[i] || '';
    const lineB = linesB[i] || '';
    
    if (lineA === lineB && lineA !== '') {
      differences.push({
        type: 'unchanged',
        text: lineA,
        lineNumber: i + 1
      });
    } else {
      if (lineA && !lineB) {
        differences.push({
          type: 'removed',
          text: lineA,
          lineNumber: i + 1
        });
      } else if (!lineA && lineB) {
        differences.push({
          type: 'added',
          text: lineB,
          lineNumber: i + 1
        });
      } else if (lineA && lineB && lineA !== lineB) {
        differences.push({
          type: 'removed',
          text: lineA,
          lineNumber: i + 1
        });
        differences.push({
          type: 'added',
          text: lineB,
          lineNumber: i + 1
        });
      }
    }
  }
  
  return differences;
}

/**
 * Calculate similarity percentage between two texts
 */
function calculateSimilarity(textA: string, textB: string): number {
  if (!textA && !textB) return 100;
  if (!textA || !textB) return 0;
  
  const wordsA = textA.toLowerCase().split(/\s+/);
  const wordsB = textB.toLowerCase().split(/\s+/);
  
  const allWords = new Set([...wordsA, ...wordsB]);
  let commonWords = 0;
  
  for (const word of allWords) {
    const countA = wordsA.filter(w => w === word).length;
    const countB = wordsB.filter(w => w === word).length;
    commonWords += Math.min(countA, countB);
  }
  
  const totalWords = Math.max(wordsA.length, wordsB.length);
  return Math.round((commonWords / totalWords) * 100);
}

/**
 * Count words in a text string
 */
function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate if file is a supported Word document
 */
export function isValidWordFile(file: File): boolean {
  const validExtensions = ['.docx'];
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const hasValidExtension = validExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  const hasValidMimeType = validMimeTypes.includes(file.type);
  
  return hasValidExtension || hasValidMimeType;
}