import { useState } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface Registration {
  id: string;
  full_name: string;
  email: string;
  registration_number: string;
  status: string;
  company?: string;
}

interface CheckInSearchProps {
  eventId: string;
  onSelect: (registration: Registration) => void;
}

export function CheckInSearch({ eventId, onSelect }: CheckInSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Registration[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchTerm = query.trim().toLowerCase();
      
      const { data, error } = await supabase
        .from('registrations')
        .select('id, full_name, email, registration_number, status, company')
        .eq('event_id', eventId)
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-success/10 text-success">Checked In</Badge>;
      case 'confirmed':
        return <Badge className="bg-primary/10 text-primary">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or registration number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching || !query.trim()}>
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </div>

      {hasSearched && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <User className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No registrations found</p>
              </CardContent>
            </Card>
          ) : (
            results.map((registration) => (
              <Card
                key={registration.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onSelect(registration)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{registration.full_name}</p>
                      <p className="text-sm text-muted-foreground">{registration.email}</p>
                      {registration.company && (
                        <p className="text-sm text-muted-foreground">{registration.company}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        #{registration.registration_number}
                      </p>
                    </div>
                    {getStatusBadge(registration.status)}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
