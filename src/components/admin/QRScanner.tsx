import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
}

export function QRScanner({ onScan, onError, isActive = true }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current || scannerRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          // Optional: Stop after successful scan
          // stopScanner();
        },
        (errorMessage) => {
          // QR code not detected, this is normal during scanning
        }
      );

      setIsScanning(true);
      setHasPermission(true);
      setError(null);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setHasPermission(false);
      setError(err.message || 'Failed to start camera');
      onError?.(err.message || 'Failed to start camera');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive]);

  if (hasPermission === false) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CameraOff className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-sm">
            Please allow camera access to scan QR codes. Check your browser settings if the permission was denied.
          </p>
          {error && (
            <p className="text-destructive text-sm mb-4">{error}</p>
          )}
          <Button onClick={startScanner}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full max-w-md mx-auto rounded-lg overflow-hidden bg-black"
        style={{ minHeight: '300px' }}
      />
      
      {!isScanning && hasPermission === null && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Starting camera...</p>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-primary rounded-lg shadow-lg">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>
      </div>

      {isScanning && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          Position the QR code within the frame
        </p>
      )}
    </div>
  );
}
