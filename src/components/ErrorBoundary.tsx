import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details - these won't be dropped in production with our updated config
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);
    
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCacheAndReload = async () => {
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Cleared caches:', cacheNames);
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('Unregistered service workers:', registrations.length);
      }
      
      // Clear local storage (preserve auth if possible)
      const authKey = Object.keys(localStorage).find(key => key.includes('supabase.auth'));
      const authValue = authKey ? localStorage.getItem(authKey) : null;
      localStorage.clear();
      if (authKey && authValue) {
        localStorage.setItem(authKey, authValue);
      }
      
      // Clear session storage
      sessionStorage.clear();
      
      // Force reload
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      // Fallback to simple reload
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground text-sm">
              We're sorry, but something unexpected happened. This might be due to cached data or a temporary issue.
            </p>
            
            {/* Show error details in development or for debugging */}
            {this.state.error && (
              <details className="text-left bg-muted/50 rounded-lg p-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground font-medium">
                  Error Details
                </summary>
                <pre className="mt-2 overflow-auto max-h-32 text-destructive whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
            
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={this.handleClearCacheAndReload} className="gap-2 w-full">
                <Trash2 className="w-4 h-4" />
                Clear Cache & Reload
              </Button>
              <Button variant="outline" onClick={this.handleReload} className="gap-2 w-full">
                <RefreshCw className="w-4 h-4" />
                Simple Reload
              </Button>
            </div>
            
            <p className="text-muted-foreground text-xs pt-2">
              If the problem persists, try opening the app in an incognito/private window.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
