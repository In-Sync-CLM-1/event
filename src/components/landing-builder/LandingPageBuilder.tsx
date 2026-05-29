import { useState, useEffect } from 'react';
import { Save, Eye, Loader2, LayoutGrid, Code, Globe, GlobeLock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { SectionPalette } from './SectionPalette';
import { SectionEditor } from './SectionEditor';
import { SectionPreview } from './SectionPreview';
import { HTMLUploader } from './HTMLUploader';
import { useLandingPage, useUpsertLandingPage, usePublishLandingPage, type LandingPageSection } from '@/hooks/useLandingPage';

// Generate unique IDs without additional dependency
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

interface LandingPageBuilderProps {
  eventId: string;
  event?: {
    title: string;
    description?: string;
    banner_url?: string;
    start_date: string;
    end_date: string;
    venue?: string;
    city?: string;
    speakers?: Array<any>;
    sessions?: Array<any>;
    sponsors?: Array<any>;
  };
}

export function LandingPageBuilder({ eventId, event }: LandingPageBuilderProps) {
  const { data: landingPage, isLoading } = useLandingPage(eventId);
  const upsertLandingPage = useUpsertLandingPage();
  const publishLandingPage = usePublishLandingPage();
  const { toast } = useToast();

  const [pageType, setPageType] = useState<'builder' | 'html'>('builder');
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [customHtml, setCustomHtml] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing landing page data
  useEffect(() => {
    if (landingPage) {
      setPageType(landingPage.page_type);
      setSections(landingPage.sections || []);
      setCustomHtml(landingPage.custom_html || '');
      setCustomCss(landingPage.custom_css || '');
      setIsPublished(landingPage.is_published);
    }
  }, [landingPage]);

  const addSection = (type: string) => {
    const newSection: LandingPageSection = {
      id: generateId(),
      type: type as LandingPageSection['type'],
      config: getDefaultConfig(type),
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const getDefaultConfig = (type: string): Record<string, any> => {
    switch (type) {
      case 'hero':
        return {
          headline: event?.title || '',
          subheadline: '',
          ctaText: 'Register Now',
        };
      case 'about':
        return {
          title: 'About This Event',
          content: event?.description || '',
        };
      case 'speakers':
        return { title: 'Meet Our Speakers' };
      case 'agenda':
        return { title: 'Event Schedule' };
      case 'sponsors':
        return { title: 'Our Sponsors' };
      case 'cta':
        return {
          headline: 'Ready to Join?',
          description: "Don't miss out on this amazing event.",
          buttonText: 'Register Now',
        };
      default:
        return {};
    }
  };

  const updateSection = (updatedSection: LandingPageSection) => {
    setSections(sections.map((s) => (s.id === updatedSection.id ? updatedSection : s)));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    // Update order values
    newSections.forEach((s, i) => (s.order = i));
    setSections(newSections);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertLandingPage.mutateAsync({
        event_id: eventId,
        page_type: pageType,
        sections: pageType === 'builder' ? sections : [],
        custom_html: pageType === 'html' ? customHtml : null,
        custom_css: pageType === 'html' ? customCss : null,
        is_published: isPublished,
      });
      toast({ title: 'Landing page saved successfully' });
    } catch (error) {
      toast({
        title: 'Failed to save landing page',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    const newPublishState = !isPublished;
    try {
      // First save current changes
      await upsertLandingPage.mutateAsync({
        event_id: eventId,
        page_type: pageType,
        sections: pageType === 'builder' ? sections : [],
        custom_html: pageType === 'html' ? customHtml : null,
        custom_css: pageType === 'html' ? customCss : null,
        is_published: newPublishState,
      });
      setIsPublished(newPublishState);
      toast({
        title: newPublishState ? 'Landing page published' : 'Landing page unpublished',
        description: newPublishState
          ? 'Your custom landing page is now live.'
          : 'The default event page will be shown.',
      });
    } catch (error) {
      toast({
        title: 'Failed to update publish status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <Tabs value={pageType} onValueChange={(v) => setPageType(v as 'builder' | 'html')}>
          <TabsList>
            <TabsTrigger value="builder" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Drag & Drop
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-2">
              <Code className="h-4 w-4" />
              Custom HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            variant={isPublished ? 'default' : 'outline'}
            size="sm"
            onClick={handlePublishToggle}
            className="gap-2"
          >
            {isPublished ? (
              <>
                <Globe className="h-4 w-4" />
                Published
              </>
            ) : (
              <>
                <GlobeLock className="h-4 w-4" />
                Unpublished
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {pageType === 'builder' ? (
          <>
            {/* Left Panel - Section Palette & Editor */}
            <div className="w-80 border-r bg-muted/30 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  <SectionPalette onAddSection={addSection} />

                  {sections.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Page Sections
                      </h3>
                      <div className="space-y-2">
                        {sections.map((section, index) => (
                          <SectionEditor
                            key={section.id}
                            section={section}
                            onUpdate={updateSection}
                            onDelete={deleteSection}
                            onMoveUp={() => moveSection(index, 'up')}
                            onMoveDown={() => moveSection(index, 'down')}
                            isFirst={index === 0}
                            isLast={index === sections.length - 1}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="flex-1 bg-background overflow-auto">
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Live Preview</span>
              </div>
              <div className="min-h-full">
                {sections.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] text-center text-muted-foreground">
                    <div>
                      <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Add sections from the left panel to build your landing page</p>
                    </div>
                  </div>
                ) : (
                  sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                      <SectionPreview key={section.id} section={section} event={event} />
                    ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Left Panel - HTML Editor */}
            <div className="w-1/2 border-r overflow-auto">
              <div className="p-4">
                <HTMLUploader
                  html={customHtml}
                  css={customCss}
                  onHTMLChange={setCustomHtml}
                  onCSSChange={setCustomCss}
                />
              </div>
            </div>

            {/* Right Panel - HTML Preview */}
            <div className="w-1/2 bg-background overflow-auto">
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Live Preview</span>
              </div>
              {customHtml ? (
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <style>${customCss}</style>
                      </head>
                      <body>${customHtml}</body>
                    </html>
                  `}
                  className="w-full min-h-[600px] border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-[400px] text-center text-muted-foreground">
                  <div>
                    <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upload or paste HTML to see a preview</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
