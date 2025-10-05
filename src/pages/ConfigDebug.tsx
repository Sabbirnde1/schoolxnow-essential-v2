import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabaseConfig } from "@/integrations/supabase/client";
import { validateEnvironmentVariables, diagnoseConfiguration } from "@/lib/config-validator";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ConfigDebug = () => {
  const navigate = useNavigate();
  const report = validateEnvironmentVariables();

  const handleRunDiagnostics = () => {
    diagnoseConfiguration();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Configuration Debug</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {report.valid ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  Configuration Valid
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-destructive" />
                  Configuration Invalid
                </>
              )}
            </CardTitle>
            <CardDescription>
              {report.valid
                ? "All required environment variables are properly configured"
                : "Some environment variables are missing or invalid"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Status:</span>
                <Badge variant={report.valid ? "default" : "destructive"}>
                  {report.valid ? "Healthy" : "Issues Detected"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Errors:</span>
                <Badge variant={report.errors.length > 0 ? "destructive" : "outline"}>
                  {report.errors.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Warnings:</span>
                <Badge variant={report.warnings.length > 0 ? "secondary" : "outline"}>
                  {report.warnings.length}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        {report.errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Errors Found</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {report.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {report.warnings.length > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {report.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Configuration Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
            <CardDescription>Current environment variable values</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {Object.entries(report.info).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <span className="font-semibold">{key}:</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supabase Config */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Supabase Client Status</CardTitle>
            <CardDescription>Client initialization details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold">Configured:</span>
                <Badge variant={supabaseConfig.isConfigured ? "default" : "destructive"}>
                  {supabaseConfig.isConfigured ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold">URL:</span>
                <span className="text-muted-foreground">{supabaseConfig.url}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold">Mode:</span>
                <span className="text-muted-foreground">{supabaseConfig.mode}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold">Development:</span>
                <Badge variant={supabaseConfig.isDev ? "default" : "outline"}>
                  {supabaseConfig.isDev ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Actions</CardTitle>
            <CardDescription>Tools to help diagnose and fix configuration issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRunDiagnostics} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Full Diagnostics (Check Console)
            </Button>

            {!report.valid && (
              <Alert>
                <AlertTitle>Quick Fix Steps:</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside mt-2 space-y-2">
                    <li>Copy <code>.env.example</code> to <code>.env</code></li>
                    <li>Open <code>.env</code> and fill in your Supabase credentials</li>
                    <li>Get credentials from: <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Supabase Dashboard</a></li>
                    <li>Restart the development server</li>
                    <li>Refresh this page</li>
                  </ol>
                  <p className="mt-4">
                    📖 For detailed instructions, see <code>ENV_SETUP.md</code>
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConfigDebug;
