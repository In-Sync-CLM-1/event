import { useState } from 'react';
import { QrCode, CheckCircle, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCreateCheckIn } from '@/hooks/useCheckIns';

interface AttendeeCheckInProps {
  eventId: string;
}

export function AttendeeCheckIn({ eventId }: AttendeeCheckInProps) {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [attendeeName, setAttendeeName] = useState('');
  const { toast } = useToast();
  const createCheckIn = useCreateCheckIn();

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your registration email.',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);

    try {
      // Find registration by email
      const { data: registration, error } = await supabase
        .from('registrations')
        .select('id, full_name, status')
        .eq('event_id', eventId)
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error || !registration) {
        toast({
          title: 'Registration not found',
          description: 'No registration found with this email for this event.',
          variant: 'destructive',
        });
        setIsSearching(false);
        return;
      }

      if (registration.status === 'checked_in') {
        setAttendeeName(registration.full_name);
        setCheckedIn(true);
        toast({
          title: 'Already checked in',
          description: `Welcome back, ${registration.full_name}!`,
        });
        setIsSearching(false);
        return;
      }

      if (registration.status === 'cancelled') {
        toast({
          title: 'Registration cancelled',
          description: 'This registration has been cancelled.',
          variant: 'destructive',
        });
        setIsSearching(false);
        return;
      }

      // Perform check-in
      await createCheckIn.mutateAsync({
        registrationId: registration.id,
        eventId,
        method: 'self_checkin',
      });

      setAttendeeName(registration.full_name);
      setCheckedIn(true);
      toast({
        title: 'Checked in successfully!',
        description: `Welcome, ${registration.full_name}!`,
      });
    } catch (error: any) {
      if (error.message === 'Already checked in') {
        toast({
          title: 'Already checked in',
          description: 'You have already checked in to this event.',
        });
      } else {
        toast({
          title: 'Check-in failed',
          description: 'An error occurred. Please try again or contact staff.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  if (checkedIn) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                You're checked in!
              </h3>
              <p className="text-green-700 dark:text-green-300 mt-1">
                Welcome, {attendeeName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Self Check-In
        </CardTitle>
        <CardDescription>
          Enter your registration email to check in to this event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              disabled={isSearching}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSearching || !email.trim()}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Check In
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
