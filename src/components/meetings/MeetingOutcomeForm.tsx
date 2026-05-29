import { useState } from 'react';
import { Star, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MeetingBooking, useRecordMeetingOutcome } from '@/hooks/useMeetingSpots';

interface MeetingOutcomeFormProps {
  booking: MeetingBooking;
  open: boolean;
  onClose: () => void;
}

export function MeetingOutcomeForm({ booking, open, onClose }: MeetingOutcomeFormProps) {
  const [notes, setNotes] = useState(booking.outcome_notes || '');
  const [rating, setRating] = useState(booking.outcome_rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [topics, setTopics] = useState<string[]>(booking.topics_discussed || []);
  const [newTopic, setNewTopic] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(booking.follow_up_required || false);

  const recordOutcome = useRecordMeetingOutcome();

  const otherPerson = booking.requester_registration_id === booking.target_registration_id
    ? booking.target
    : booking.requester_registration_id === booking.id
    ? booking.target
    : booking.requester;

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };

  const handleSubmit = async () => {
    await recordOutcome.mutateAsync({
      bookingId: booking.id,
      outcome: {
        outcome_notes: notes || undefined,
        outcome_rating: rating || undefined,
        topics_discussed: topics.length > 0 ? topics : undefined,
        follow_up_required: followUpRequired,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Meeting Outcome</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="text-sm text-muted-foreground">
            Meeting with <span className="font-medium text-foreground">{otherPerson?.full_name}</span>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>How was the meeting?</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none focus:ring-2 focus:ring-ring rounded"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      value <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div className="space-y-2">
            <Label>Topics Discussed</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a topic..."
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddTopic}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {topics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="gap-1">
                    {topic}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Key takeaways, action items, insights..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Follow-up */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUp"
              checked={followUpRequired}
              onCheckedChange={(checked) => setFollowUpRequired(checked as boolean)}
            />
            <Label htmlFor="followUp" className="cursor-pointer">
              Follow-up required
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={recordOutcome.isPending}>
            {recordOutcome.isPending ? 'Saving...' : 'Save Outcome'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
