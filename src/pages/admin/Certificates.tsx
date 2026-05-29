import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Award, 
  Download, 
  Plus, 
  Loader2,
  FileText,
  CheckCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useEvent } from '@/hooks/useEvents';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useCertificates, useBulkIssueCertificates, useCertificateTemplates } from '@/hooks/useCertificates';
import { useToast } from '@/hooks/use-toast';

export default function AdminCertificates() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  
  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: registrations } = useRegistrations(eventId || '');
  const { data: certificates, isLoading: certificatesLoading } = useCertificates(eventId);
  const { data: templates } = useCertificateTemplates(eventId);
  const bulkIssueCertificates = useBulkIssueCertificates();

  const [isBulkIssueOpen, setIsBulkIssueOpen] = useState(false);
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);

  // Get eligible registrations (checked in and no certificate yet)
  const eligibleRegistrations = registrations?.filter(r => 
    r.status === 'checked_in' && 
    !certificates?.some(c => c.registration_id === r.id)
  ) || [];

  const handleToggleRegistration = (id: string) => {
    setSelectedRegistrations(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRegistrations.length === eligibleRegistrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(eligibleRegistrations.map(r => r.id));
    }
  };

  const handleBulkIssue = async () => {
    if (selectedRegistrations.length === 0 || !eventId) return;

    try {
      await bulkIssueCertificates.mutateAsync({
        eventId,
        registrationIds: selectedRegistrations,
        templateId: templates?.[0]?.id,
      });

      toast({
        title: 'Certificates issued',
        description: `Successfully issued ${selectedRegistrations.length} certificates.`,
      });

      setSelectedRegistrations([]);
      setIsBulkIssueOpen(false);
    } catch (error) {
      toast({
        title: 'Failed to issue certificates',
        description: 'Some certificates may have already been issued.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = eventLoading || certificatesLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to={`/admin/events/${eventId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">Certificates</h1>
            <p className="text-muted-foreground mt-1">
              {event?.title} - Issue and manage certificates
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/admin/events/${eventId}/certificate-template`}>
                <FileText className="h-4 w-4 mr-2" />
                Design Template
              </Link>
            </Button>
            <Button onClick={() => setIsBulkIssueOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Issue Certificates
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Issued
              </CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificates?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Eligible (Checked In)
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eligibleRegistrations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Templates
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{templates?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : certificates?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No certificates issued</h2>
              <p className="text-muted-foreground mb-6 text-center">
                Issue certificates to attendees who have checked in
              </p>
              <Button onClick={() => setIsBulkIssueOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Issue Certificates
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Issued Certificates</CardTitle>
              <CardDescription>
                All certificates issued for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate #</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates?.map((cert: any) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-mono text-sm">
                        {cert.certificate_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cert.registration?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {cert.registration?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(cert.issued_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/verify/${cert.certificate_number}`} target="_blank">
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Issue Dialog */}
      <Dialog open={isBulkIssueOpen} onOpenChange={setIsBulkIssueOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Certificates</DialogTitle>
            <DialogDescription>
              Select attendees who have checked in to issue certificates
            </DialogDescription>
          </DialogHeader>

          {eligibleRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No eligible attendees. Attendees must check in before receiving certificates.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 p-2 border-b">
                <Checkbox
                  checked={selectedRegistrations.length === eligibleRegistrations.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  Select All ({eligibleRegistrations.length} eligible)
                </span>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {eligibleRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedRegistrations.includes(reg.id)}
                      onCheckedChange={() => handleToggleRegistration(reg.id)}
                    />
                    <div>
                      <p className="font-medium">{reg.full_name}</p>
                      <p className="text-sm text-muted-foreground">{reg.email}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsBulkIssueOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBulkIssue}
                  disabled={selectedRegistrations.length === 0 || bulkIssueCertificates.isPending}
                >
                  {bulkIssueCertificates.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Issue {selectedRegistrations.length} Certificate{selectedRegistrations.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
