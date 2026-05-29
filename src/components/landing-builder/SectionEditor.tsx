import { useState } from 'react';
import { GripVertical, Trash2, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { LandingPageSection } from '@/hooks/useLandingPage';

interface SectionEditorProps {
  section: LandingPageSection;
  onUpdate: (section: LandingPageSection) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Hero Banner',
  about: 'About / Text Block',
  speakers: 'Speakers Grid',
  agenda: 'Agenda / Schedule',
  sponsors: 'Sponsors',
  cta: 'Call to Action',
};

export function SectionEditor({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SectionEditorProps) {
  const [isOpen, setIsOpen] = useState(true);

  const updateConfig = (key: string, value: any) => {
    onUpdate({
      ...section,
      config: { ...section.config, [key]: value },
    });
  };

  const renderConfigFields = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input
                value={section.config.headline || ''}
                onChange={(e) => updateConfig('headline', e.target.value)}
                placeholder="Welcome to Our Event"
              />
            </div>
            <div>
              <Label>Subheadline</Label>
              <Input
                value={section.config.subheadline || ''}
                onChange={(e) => updateConfig('subheadline', e.target.value)}
                placeholder="Join us for an amazing experience"
              />
            </div>
            <div>
              <Label>Background Image URL</Label>
              <Input
                value={section.config.backgroundImage || ''}
                onChange={(e) => updateConfig('backgroundImage', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>CTA Button Text</Label>
              <Input
                value={section.config.ctaText || ''}
                onChange={(e) => updateConfig('ctaText', e.target.value)}
                placeholder="Register Now"
              />
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={section.config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="About This Event"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={section.config.content || ''}
                onChange={(e) => updateConfig('content', e.target.value)}
                placeholder="Enter your content here..."
                rows={5}
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input
                value={section.config.imageUrl || ''}
                onChange={(e) => updateConfig('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        );

      case 'speakers':
        return (
          <div className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={section.config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Meet Our Speakers"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Speakers will be automatically populated from your event data.
            </p>
          </div>
        );

      case 'agenda':
        return (
          <div className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={section.config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Event Schedule"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Sessions will be automatically populated from your event data.
            </p>
          </div>
        );

      case 'sponsors':
        return (
          <div className="space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input
                value={section.config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Our Sponsors"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Sponsors will be automatically populated from your event data.
            </p>
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-4">
            <div>
              <Label>Headline</Label>
              <Input
                value={section.config.headline || ''}
                onChange={(e) => updateConfig('headline', e.target.value)}
                placeholder="Ready to Join?"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={section.config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                placeholder="Don't miss out on this amazing event..."
                rows={2}
              />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input
                value={section.config.buttonText || ''}
                onChange={(e) => updateConfig('buttonText', e.target.value)}
                placeholder="Register Now"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1 justify-start gap-2 px-2">
                <Settings className="h-4 w-4" />
                <span className="font-medium">{SECTION_LABELS[section.type]}</span>
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onMoveUp}
                disabled={isFirst}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onMoveDown}
                disabled={isLast}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            {renderConfigFields()}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
