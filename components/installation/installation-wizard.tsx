"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Users,
  Shield,
  AlertTriangle,
  Copy,
  RefreshCw,
} from "lucide-react";
import {
  checkEnvironmentVariables,
  checkDatabaseConnection,
  checkLocalMongoDB,
  runInstallation,
} from "@/lib/actions/installation";
import { useRouter } from "next/navigation";

type Step = "welcome" | "environment" | "database" | "admin" | "complete";

export function InstallationWizard({ initialStep }: { initialStep?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Environment check state
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Database state
  const [mongodbUri, setMongodbUri] = useState("");
  const [localMongoDetected, setLocalMongoDetected] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Admin user state
  const [adminUsername, setAdminUsername] = useState("admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminName, setAdminName] = useState("System Administrator");

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    setGeneratedSecret(secret);
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(generatedSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    if (currentStep === "environment") {
      checkEnv();
      generateSecret();
    }
  }, [currentStep]);

  const checkEnv = async () => {
    const result = await checkEnvironmentVariables();
    setEnvStatus(result);

    if (result.allPresent) {
      // Try to connect with existing URI
      const dbCheck = await checkDatabaseConnection();
      if (dbCheck.success) {
        setDbConnected(true);
        setSuccess("Environment and database configured correctly");
      }
    }
  };

  const handleCheckLocalMongo = async () => {
    setError(null);
    startTransition(async () => {
      const result = await checkLocalMongoDB();
      if (result.success && result.uri) {
        setLocalMongoDetected(true);
        setMongodbUri(result.uri);
        setSuccess(result.message || "");
      } else {
        setError(result.message || "No local MongoDB found");
      }
    });
  };

  const handleTestConnection = async () => {
    if (!mongodbUri) {
      setError("Please enter a MongoDB URI");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await checkDatabaseConnection(mongodbUri);
      if (result.success) {
        setDbConnected(true);
        setSuccess("Successfully connected to database");
      } else {
        setDbConnected(false);
        setError(result.error || "Failed to connect");
      }
    });
  };

  const handleInstall = async () => {
    if (!adminEmail || !adminPassword) {
      setError("Please fill in all admin user fields");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await runInstallation({
        mongodbUri,
        adminUsername,
        adminEmail,
        adminPassword,
        adminName,
      });

      if (result.success) {
        setCurrentStep("complete");
      } else {
        setError(result.error || "Installation failed");
      }
    });
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "welcome", label: "Welcome" },
      { id: "environment", label: "Environment" },
      { id: "database", label: "Database" },
      { id: "admin", label: "Admin User" },
      { id: "complete", label: "Complete" },
    ];

    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    return (
      <div className="flex items-center justify-center mb-8 gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index < currentIndex
                  ? "bg-success text-success-foreground"
                  : index === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {index < currentIndex ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-1 mx-1 ${
                  index < currentIndex ? "bg-success" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          System Installation
        </CardTitle>
        <CardDescription className="text-center">
          Set up your IT Assets Manager
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepIndicator()}

        {/* Welcome Step */}
        {currentStep === "welcome" && (
          <div className="space-y-6">
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Shield className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">
                Welcome to IT Ticketing System
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This wizard will guide you through the installation process.
                We'll check your environment, configure the database, and create
                your admin account.
              </p>
            </div>
            <Button
              onClick={() => setCurrentStep("environment")}
              className="w-full"
            >
              Get Started
            </Button>
          </div>
        )}

        {/* Environment Check Step */}
        {currentStep === "environment" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                Environment Configuration
              </h3>

              {envStatus && (
                <div className="space-y-2">
                  {envStatus.allPresent ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        All required environment variables are configured
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Missing environment variables:{" "}
                          {envStatus.missingVars.join(", ")}
                          <div className="mt-2 text-sm">
                            Please add these to your .env file before
                            continuing.
                          </div>
                        </AlertDescription>
                      </Alert>

                      {envStatus.missingVars.includes("SESSION_SECRET") && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-semibold">
                              Generated SESSION_SECRET
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={generateSecret}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regenerate
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={copySecret}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                {copiedSecret ? "Copied!" : "Copy"}
                              </Button>
                            </div>
                          </div>
                          <div className="bg-background p-3 rounded border">
                            <code className="text-xs break-all font-mono">
                              {generatedSecret}
                            </code>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Add this to your .env file as: SESSION_SECRET=
                            {generatedSecret}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("welcome")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("database")}
                disabled={!envStatus?.allPresent}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Database Step */}
        {currentStep === "database" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </h3>

              {!localMongoDetected && !dbConnected && (
                <Button
                  variant="outline"
                  onClick={handleCheckLocalMongo}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Check for Local MongoDB
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="mongodbUri">MongoDB Connection URI</Label>
                <Input
                  id="mongodbUri"
                  type="text"
                  value={mongodbUri}
                  onChange={(e) => setMongodbUri(e.target.value)}
                  placeholder="mongodb://localhost:27017/ticketing"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Example: mongodb://localhost:27017/ticketing or
                  mongodb+srv://...
                </p>
              </div>

              <Button
                onClick={handleTestConnection}
                disabled={isPending || !mongodbUri}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Test Connection
              </Button>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("environment")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep("admin")}
                disabled={!dbConnected}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Admin User Step */}
        {currentStep === "admin" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Create Admin Account
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Full Name</Label>
                  <Input
                    id="adminName"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="System Administrator"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminUsername">Username</Label>
                  <Input
                    id="adminUsername"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter a strong password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 6 characters recommended
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("database")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleInstall}
                disabled={isPending || !adminEmail || !adminPassword}
                className="flex-1"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Install System
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <div className="space-y-6">
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="p-4 bg-success/10 rounded-full">
                  <CheckCircle2 className="h-16 w-16 text-success" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Installation Complete!</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your IT Ticketing System has been successfully installed and
                configured. You can now log in with your admin credentials.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
