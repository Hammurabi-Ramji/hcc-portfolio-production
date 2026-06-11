/**
 * Content Extraction & Processing System
 * Article summarization, PDF annotation, web archiving, citation generation, and more
 */

export interface ExtractedContent {
  title: string;
  url: string;
  content: string;
  summary?: string;
  images: string[];
  tables: TableData[];
  codeSnippets: CodeSnippet[];
  metadata: ContentMetadata;
  timestamp: number;
}

export interface ContentMetadata {
  author?: string;
  publishDate?: string;
  language?: string;
  wordCount: number;
  readingTime: number; // in minutes
  charset?: string;
  description?: string;
}

export interface TableData {
  id: string;
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface CodeSnippet {
  id: string;
  language: string;
  code: string;
  lineNumbers?: boolean;
}

export interface Citation {
  format: 'apa' | 'mla' | 'chicago';
  text: string;
}

export interface ArchiveEntry {
  id: string;
  url: string;
  title: string;
  content: ExtractedContent;
  archivedAt: number;
  tags?: string[];
}

/**
 * ContentExtractor handles content extraction and processing
 */
export class ContentExtractor {
  private archivedPages: Map<string, ArchiveEntry> = new Map();
  private extractedCache: Map<string, ExtractedContent> = new Map();
  private maxCacheSize: number = 1000;

  /**
   * Extract content from HTML
   */
  public async extractContent(html: string, url: string): Promise<ExtractedContent> {
    // Check cache
    if (this.extractedCache.has(url)) {
      return this.extractedCache.get(url)!;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = this.extractTitle(doc);
    const content = this.extractMainContent(doc);
    const images = this.extractImages(doc);
    const tables = this.extractTables(doc);
    const codeSnippets = this.extractCodeSnippets(doc);
    const metadata = this.extractMetadata(doc, content);

    const extracted: ExtractedContent = {
      title,
      url,
      content,
      images,
      tables,
      codeSnippets,
      metadata,
      timestamp: Date.now(),
    };

    // Cache the result
    this.addToCache(url, extracted);

    return extracted;
  }

  /**
   * Extract title from document
   */
  private extractTitle(doc: Document): string {
    const titleTag = doc.querySelector('title');
    if (titleTag?.textContent) {
      return titleTag.textContent;
    }

    const h1 = doc.querySelector('h1');
    if (h1?.textContent) {
      return h1.textContent;
    }

    return 'Untitled';
  }

  /**
   * Extract main content from document
   */
  private extractMainContent(doc: Document): string {
    // Try to find article tag first
    let content = doc.querySelector('article');
    if (!content) {
      content = doc.querySelector('main');
    }
    if (!content) {
      content = doc.querySelector('[role="main"]');
    }
    if (!content) {
      content = doc.body;
    }

    // Remove script and style tags
    const scripts = content.querySelectorAll('script, style');
    scripts.forEach((s) => s.remove());

    // Get text content
    return content.textContent?.trim() || '';
  }

  /**
   * Extract images from document
   */
  private extractImages(doc: Document): string[] {
    const images: string[] = [];
    const imgElements = doc.querySelectorAll('img');

    for (const img of imgElements) {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      if (src && !images.includes(src)) {
        images.push(src);
      }
    }

    return images;
  }

  /**
   * Extract tables from document
   */
  private extractTables(doc: Document): TableData[] {
    const tables: TableData[] = [];
    const tableElements = doc.querySelectorAll('table');

    for (let i = 0; i < tableElements.length; i++) {
      const table = tableElements[i];
      const headers: string[] = [];
      const rows: string[][] = [];

      // Extract headers
      const headerCells = table.querySelectorAll('thead th, thead td');
      for (const cell of headerCells) {
        headers.push(cell.textContent?.trim() || '');
      }

      // Extract rows
      const bodyCells = table.querySelectorAll('tbody tr');
      for (const row of bodyCells) {
        const cells = row.querySelectorAll('td');
        const rowData: string[] = [];
        for (const cell of cells) {
          rowData.push(cell.textContent?.trim() || '');
        }
        if (rowData.length > 0) {
          rows.push(rowData);
        }
      }

      if (headers.length > 0 || rows.length > 0) {
        tables.push({
          id: `table_${i}`,
          headers,
          rows,
          caption: table.querySelector('caption')?.textContent || undefined,
        });
      }
    }

    return tables;
  }

  /**
   * Extract code snippets from document
   */
  private extractCodeSnippets(doc: Document): CodeSnippet[] {
    const snippets: CodeSnippet[] = [];
    const codeElements = doc.querySelectorAll('pre code, code');

    for (let i = 0; i < codeElements.length; i++) {
      const code = codeElements[i];
      const className = code.getAttribute('class') || '';
      const language = className.replace('language-', '') || 'plaintext';

      snippets.push({
        id: `code_${i}`,
        language,
        code: code.textContent || '',
        lineNumbers: code.parentElement?.tagName === 'PRE',
      });
    }

    return snippets;
  }

  /**
   * Extract metadata from document
   */
  private extractMetadata(doc: Document, content: string): ContentMetadata {
    const author =
      doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="article:author"]')?.getAttribute('content');

    const publishDate =
      doc.querySelector('meta[name="publish_date"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content');

    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content');

    const language = doc.documentElement.getAttribute('lang') || 'en';
    const charset = doc.characterSet || 'utf-8';

    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average 200 words per minute

    return {
      author: author || undefined,
      publishDate: publishDate || undefined,
      language,
      wordCount,
      readingTime,
      charset,
      description: description || undefined,
    };
  }

  /**
   * Summarize content using extractive summarization
   */
  public summarizeContent(content: string, sentenceCount: number = 3): string {
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length <= sentenceCount) {
      return content;
    }

    // Score sentences based on keyword frequency
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();

    for (const word of words) {
      const cleanWord = word.replace(/[^a-z0-9]/g, '');
      if (cleanWord.length > 3) {
        wordFreq.set(cleanWord, (wordFreq.get(cleanWord) || 0) + 1);
      }
    }

    const scoredSentences = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      let score = 0;

      for (const word of sentenceWords) {
        const cleanWord = word.replace(/[^a-z0-9]/g, '');
        score += wordFreq.get(cleanWord) || 0;
      }

      return { sentence: sentence.trim(), score, index };
    });

    // Select top sentences and sort by original order
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceCount)
      .sort((a, b) => a.index - b.index)
      .map((s) => s.sentence);

    return topSentences.join(' ');
  }

  /**
   * Generate citation in specified format
   */
  public generateCitation(
    content: ExtractedContent,
    format: 'apa' | 'mla' | 'chicago' = 'apa'
  ): Citation {
    const { title, url, metadata } = content;
    const author = metadata.author || 'Unknown';
    const date = metadata.publishDate || new Date().toISOString().split('T')[0];

    let citationText = '';

    switch (format) {
      case 'apa':
        citationText = `${author} (${date}). ${title}. Retrieved from ${url}`;
        break;
      case 'mla':
        citationText = `${author}. "${title}." Web. ${date}. <${url}>`;
        break;
      case 'chicago':
        citationText = `${author}. "${title}." Accessed ${date}. ${url}`;
        break;
    }

    return {
      format,
      text: citationText,
    };
  }

  /**
   * Archive a web page
   */
  public archivePage(url: string, content: ExtractedContent, tags?: string[]): ArchiveEntry {
    const id = `archive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry: ArchiveEntry = {
      id,
      url,
      title: content.title,
      content,
      archivedAt: Date.now(),
      tags,
    };

    this.archivedPages.set(id, entry);
    return entry;
  }

  /**
   * Get archived pages
   */
  public getArchivedPages(limit: number = 100): ArchiveEntry[] {
    return Array.from(this.archivedPages.values())
      .sort((a, b) => b.archivedAt - a.archivedAt)
      .slice(0, limit);
  }

  /**
   * Search archived pages
   */
  public searchArchive(query: string): ArchiveEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.archivedPages.values()).filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.url.toLowerCase().includes(lowerQuery) ||
        entry.content.content.toLowerCase().includes(lowerQuery) ||
        entry.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Delete archived page
   */
  public deleteArchivedPage(id: string): boolean {
    return this.archivedPages.delete(id);
  }

  /**
   * Export archived page as markdown
   */
  public exportAsMarkdown(entry: ArchiveEntry): string {
    const { content } = entry;
    let markdown = `# ${content.title}\n\n`;
    markdown += `**Source:** ${content.url}\n`;
    markdown += `**Archived:** ${new Date(content.timestamp).toLocaleString()}\n`;
    markdown += `**Reading Time:** ${content.metadata.readingTime} minutes\n\n`;

    if (content.summary) {
      markdown += `## Summary\n${content.summary}\n\n`;
    }

    markdown += `## Content\n${content.content}\n\n`;

    if (content.tables.length > 0) {
      markdown += `## Tables\n`;
      for (const table of content.tables) {
        markdown += `\n| ${table.headers.join(' | ')} |\n`;
        markdown += `| ${table.headers.map(() => '---').join(' | ')} |\n`;
        for (const row of table.rows) {
          markdown += `| ${row.join(' | ')} |\n`;
        }
      }
    }

    if (content.codeSnippets.length > 0) {
      markdown += `## Code Snippets\n`;
      for (const snippet of content.codeSnippets) {
        markdown += `\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n`;
      }
    }

    return markdown;
  }

  /**
   * Add extracted content to cache
   */
  private addToCache(url: string, content: ExtractedContent): void {
    this.extractedCache.set(url, content);

    // Maintain max cache size
    if (this.extractedCache.size > this.maxCacheSize) {
      const firstKey = this.extractedCache.keys().next().value;
      if (firstKey) {
        this.extractedCache.delete(firstKey);
      }
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.extractedCache.clear();
  }
}

// Export singleton instance
export const contentExtractor = new ContentExtractor();
