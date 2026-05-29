import { Download, X, Share } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, install, iOSInstallInstructions } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Check if user has dismissed the prompt before
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      handleDismiss();
    }
  };

  // Don't show if installed or dismissed
  if (isInstalled || dismissed) return null;

  // Show iOS-specific instructions
  if (iOSInstallInstructions) {
    return (
      <>
        <div className="pwa-install-prompt">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Download className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Install Event-Sync</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Add to your home screen for the best experience
              </p>
              <Button
                size="sm"
                className="mt-3 w-full"
                onClick={() => setShowIOSInstructions(true)}
              >
                <Share className="h-4 w-4 mr-2" />
                How to Install
              </Button>
            </div>
          </div>
        </div>

        {/* iOS Instructions Modal */}
        {showIOSInstructions && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border rounded-lg p-6 max-w-sm w-full shadow-lg">
              <h3 className="font-semibold text-lg mb-4">Install on iOS</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Tap the <Share className="h-4 w-4 inline-block mx-1" /> Share button in Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Tap "Add" to install the app</span>
                </li>
              </ol>
              <Button
                className="w-full mt-6"
                onClick={() => {
                  setShowIOSInstructions(false);
                  handleDismiss();
                }}
              >
                Got it
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Show standard install prompt
  if (!isInstallable) return null;

  return (
    <div className="pwa-install-prompt">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Download className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install Event-Sync</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Install our app for quick access and offline features
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleInstall}>
              Install
            </Button>
            <Button size="sm" variant="outline" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
