import React, { useState } from 'react';
import { Copy, Check, Download, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ 
  code, 
  language, 
  fileName, 
  showLineNumbers = true 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Handle code copying
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  // Handle code download
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `code.${getFileExtension(language)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get file extension based on language
  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      html: 'html',
      css: 'css',
      sql: 'sql',
      markdown: 'md',
      json: 'json',
      xml: 'xml',
      yaml: 'yml',
      shell: 'sh',
      bash: 'sh',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt'
    };
    return extensions[lang] || 'txt';
  };

  // Get language display name
  const getLanguageDisplayName = (lang: string): string => {
    const names: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      html: 'HTML',
      css: 'CSS',
      sql: 'SQL',
      markdown: 'Markdown',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      shell: 'Shell',
      bash: 'Bash',
      php: 'PHP',
      ruby: 'Ruby',
      go: 'Go',
      rust: 'Rust',
      swift: 'Swift',
      kotlin: 'Kotlin'
    };
    return names[lang] || lang.toUpperCase();
  };

  // Split code into lines for line numbering
  const codeLines = code.split('\n');

  return (
    <Card className="bg-gray-900 text-gray-100 border-gray-700">
      {/* Code Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-blue-400" />
          {fileName && (
            <span className="text-sm font-medium text-gray-300">{fileName}</span>
          )}
          <Badge variant="secondary" className="bg-gray-800 text-gray-300 text-xs">
            {getLanguageDisplayName(language)}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </CardHeader>

      {/* Code Content */}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <pre className="text-sm leading-relaxed">
            <code className={`language-${language}`}>
              {showLineNumbers ? (
                <div className="flex">
                  {/* Line Numbers */}
                  <div className="flex-shrink-0 px-4 py-4 bg-gray-800 text-gray-500 text-right select-none border-r border-gray-700">
                    {codeLines.map((_, index) => (
                      <div key={index} className="leading-relaxed">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  
                  {/* Code Lines */}
                  <div className="flex-1 px-4 py-4 overflow-x-auto">
                    {codeLines.map((line, index) => (
                      <div key={index} className="leading-relaxed whitespace-pre">
                        {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4">
                  {code}
                </div>
              )}
            </code>
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
