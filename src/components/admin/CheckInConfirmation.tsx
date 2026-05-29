import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CheckInConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'error' | 'already_checked_in';
  registrationName?: string;
  registrationNumber?: string;
  errorMessage?: string;
}

export function CheckInConfirmation({
  isOpen,
  onClose,
  status,
  registrationName,
  registrationNumber,
  errorMessage,
}: CheckInConfirmationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="sr-only">Check-in Result</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-6">
          {status === 'success' && (
            <>
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
              <h2 className="text-xl font-semibold text-success mb-2">Check-in Successful!</h2>
              <p className="text-lg font-medium">{registrationName}</p>
              <p className="text-sm text-muted-foreground">#{registrationNumber}</p>
            </>
          )}

          {status === 'already_checked_in' && (
            <>
              <div className="h-20 w-20 rounded-full bg-warning/10 flex items-center justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-warning" />
              </div>
              <h2 className="text-xl font-semibold text-warning mb-2">Already Checked In</h2>
              <p className="text-lg font-medium">{registrationName}</p>
              <p className="text-sm text-muted-foreground">#{registrationNumber}</p>
              <p className="text-sm text-muted-foreground mt-2">
                This attendee has already been checked in
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-destructive mb-2">Check-in Failed</h2>
              <p className="text-muted-foreground text-center">
                {errorMessage || 'Unable to check in. Please try again.'}
              </p>
            </>
          )}

          <Button onClick={onClose} className="mt-6 w-full">
            {status === 'success' ? 'Continue Scanning' : 'Try Again'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
