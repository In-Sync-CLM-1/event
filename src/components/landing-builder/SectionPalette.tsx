import { Image, FileText, Users, Calendar, Star, MousePointer2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SectionPaletteProps {
  onAddSection: (type: string) => void;
}

const SECTION_TYPES = [
  {
    type: 'hero',
    label: 'Hero Banner',
    description: 'Full-width hero with image, title & CTA',
    icon: Image,
  },
  {
    type: 'about',
    label: 'About / Text',
    description: 'Rich text content with optional image',
    icon: FileText,
  },
  {
    type: 'speakers',
    label: 'Speakers Grid',
    description: 'Auto-populated speaker cards',
    icon: Users,
  },
  {
    type: 'agenda',
    label: 'Agenda / Schedule',
    description: 'Session timeline from event data',
    icon: Calendar,
  },
  {
    type: 'sponsors',
    label: 'Sponsors',
    description: 'Sponsor logos with links',
    icon: Star,
  },
  {
    type: 'cta',
    label: 'Call to Action',
    description: 'Registration or custom CTA button',
    icon: MousePointer2,
  },
];

export function SectionPalette({ onAddSection }: SectionPaletteProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Add Sections
      </h3>
      <div className="space-y-2">
        {SECTION_TYPES.map((section) => (
          <Card
            key={section.type}
            className="cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
            onClick={() => onAddSection(section.type)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('section-type', section.type);
            }}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <section.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{section.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {section.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
