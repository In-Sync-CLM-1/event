import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Award, Calendar, User, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCertificateByNumber } from '@/hooks/useCertificates';

export default function CertificateVerify() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const { data: certificate, isLoading, error } = useCertificateByNumber(certificateNumber);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !certificate) {
    return (
      <MainLayout>
        <div className="container max-w-2xl py-12">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-destructive mb-2">
                Certificate Not Found
              </h1>
              <p className="text-muted-foreground text-center mb-6">
                The certificate number "{certificateNumber}" could not be verified.
                <br />
                Please check the number and try again.
              </p>
              <Button asChild>
                <Link to="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl py-12">
        <Card className="border-success">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
            </div>
            <Badge className="bg-success/10 text-success border-success/20 mb-4 mx-auto">
              Verified Certificate
            </Badge>
            <CardTitle className="text-2xl">Certificate of Participation</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center border-y py-6">
              <p className="text-sm text-muted-foreground mb-2">This is to certify that</p>
              <h2 className="text-3xl font-bold text-primary">
                {certificate.registration?.full_name}
              </h2>
              <p className="text-muted-foreground mt-2">
                {certificate.registration?.email}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                has successfully participated in
              </p>
              <h3 className="text-xl font-semibold">{certificate.event?.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="font-medium">
                  {format(new Date(certificate.event?.start_date), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Award className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Issued Date</p>
                <p className="font-medium">
                  {format(new Date(certificate.issued_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Certificate Number</p>
              <p className="font-mono text-lg">{certificate.certificate_number}</p>
            </div>

            <div className="flex justify-center gap-4">
              {certificate.pdf_url && (
                <Button asChild>
                  <a href={certificate.pdf_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download PDF
                  </a>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to="/events">
                  View Events
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
