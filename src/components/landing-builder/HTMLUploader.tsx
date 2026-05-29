import { useState, useRef } from 'react';
import { Upload, FileCode, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HTMLUploaderProps {
  html: string;
  css: string;
  onHTMLChange: (html: string) => void;
  onCSSChange: (css: string) => void;
}

export function HTMLUploader({ html, css, onHTMLChange, onCSSChange }: HTMLUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setError('Please upload an HTML file (.html or .htm)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onHTMLChange(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Custom HTML Page
          </CardTitle>
          <CardDescription>
            Upload an HTML file or paste your code directly. This will replace the entire landing page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your HTML file here, or
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Code Editor */}
          <Tabs defaultValue="html">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">Custom CSS</TabsTrigger>
            </TabsList>
            <TabsContent value="html" className="mt-4">
              <div className="relative">
                {html && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 z-10"
                    onClick={() => onHTMLChange('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Textarea
                  value={html}
                  onChange={(e) => onHTMLChange(e.target.value)}
                  placeholder="<!DOCTYPE html>
<html>
<head>
  <title>My Landing Page</title>
</head>
<body>
  <!-- Your content here -->
</body>
</html>"
                  className="font-mono text-sm min-h-[300px]"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Paste your complete HTML code here. External CSS and JS links will be loaded.
              </p>
            </TabsContent>
            <TabsContent value="css" className="mt-4">
              <Textarea
                value={css}
                onChange={(e) => onCSSChange(e.target.value)}
                placeholder="/* Add custom CSS styles */
.my-class {
  color: red;
}"
                className="font-mono text-sm min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Add custom CSS to style your HTML. This will be injected into the page.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
