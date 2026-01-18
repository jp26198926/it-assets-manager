"use client";

import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { updateEmailConfig, sendTestEmail } from "@/lib/actions/settings";
import type { AppSettingsSerialized, EmailProvider } from "@/lib/models/types";
import { Loader2, Mail, Server, Cloud, Send } from "lucide-react";

interface EmailConfigFormProps {
  settings: AppSettingsSerialized;
  currentUser?: { name: string };
}

export function EmailConfigForm({
  settings,
  currentUser,
}: EmailConfigFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [provider, setProvider] = useState<EmailProvider>(
    settings.emailProvider,
  );
  const [smtpConfig, setSmtpConfig] = useState({
    smtpHost: settings.smtpHost || "",
    smtpPort: settings.smtpPort || 587,
    smtpUser: settings.smtpUser || "",
    smtpPassword: settings.smtpPassword || "",
    smtpSecure: settings.smtpSecure || false,
  });
  const [apiConfig, setApiConfig] = useState({
    emailApiKey: settings.emailApiKey || "",
    emailApiEndpoint: settings.emailApiEndpoint || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateEmailConfig({
        emailProvider: provider,
        ...(provider === "smtp" ? smtpConfig : apiConfig),
        updatedBy: currentUser?.name,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Email configuration updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update email configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setTestingEmail(true);

    try {
      const result = await sendTestEmail(testEmail);

      if (result.success) {
        toast({
          title: "Success",
          description: `Test email sent to ${testEmail}. Please check your inbox.`,
        });
        setTestEmail("");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Configuration
        </CardTitle>
        <CardDescription>
          Configure email delivery settings for notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Email Provider</Label>
            <RadioGroup
              value={provider}
              onValueChange={(value) => setProvider(value as EmailProvider)}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="smtp" id="smtp" />
                <Label
                  htmlFor="smtp"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Server className="h-4 w-4" />
                  <div>
                    <p className="font-medium">SMTP Server</p>
                    <p className="text-xs text-muted-foreground">
                      Use your own mail server
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="api" id="api" />
                <Label
                  htmlFor="api"
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <Cloud className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Email API</p>
                    <p className="text-xs text-muted-foreground">
                      Use third-party email service
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {provider === "smtp" ? (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm">SMTP Configuration</h4>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host *</Label>
                  <Input
                    id="smtpHost"
                    value={smtpConfig.smtpHost}
                    onChange={(e) =>
                      setSmtpConfig({ ...smtpConfig, smtpHost: e.target.value })
                    }
                    placeholder="smtp.gmail.com"
                    required={provider === "smtp"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port *</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={smtpConfig.smtpPort}
                    onChange={(e) =>
                      setSmtpConfig({
                        ...smtpConfig,
                        smtpPort: parseInt(e.target.value),
                      })
                    }
                    placeholder="587"
                    required={provider === "smtp"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">Username *</Label>
                <Input
                  id="smtpUser"
                  value={smtpConfig.smtpUser}
                  onChange={(e) =>
                    setSmtpConfig({ ...smtpConfig, smtpUser: e.target.value })
                  }
                  placeholder="your-email@example.com"
                  required={provider === "smtp"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPassword">Password *</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={smtpConfig.smtpPassword}
                  onChange={(e) =>
                    setSmtpConfig({
                      ...smtpConfig,
                      smtpPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  required={provider === "smtp"}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For Gmail, use an App Password instead of your regular
                  password
                </p>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Port Guide:</strong>
                  <br />• Port <strong>587</strong> - TLS/STARTTLS (recommended
                  for most providers)
                  <br />• Port <strong>465</strong> - SSL (legacy, but still
                  supported)
                  <br />• Port <strong>25</strong> - Unencrypted (not
                  recommended)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm">API Configuration</h4>

              <div className="space-y-2">
                <Label htmlFor="emailApiKey">API Key *</Label>
                <Input
                  id="emailApiKey"
                  type="password"
                  value={apiConfig.emailApiKey}
                  onChange={(e) =>
                    setApiConfig({ ...apiConfig, emailApiKey: e.target.value })
                  }
                  placeholder="Enter your email API key"
                  required={provider === "api"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailApiEndpoint">API Endpoint *</Label>
                <Input
                  id="emailApiEndpoint"
                  value={apiConfig.emailApiEndpoint}
                  onChange={(e) =>
                    setApiConfig({
                      ...apiConfig,
                      emailApiEndpoint: e.target.value,
                    })
                  }
                  placeholder="https://api.emailservice.com/v1/send"
                  required={provider === "api"}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </form>

        {/* Test Email Section */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Send className="h-4 w-4" />
            Test Email Configuration
          </h4>
          <p className="text-sm text-muted-foreground mb-3">
            Send a test email to verify your configuration is working correctly.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address to test"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleTestEmail}
              disabled={testingEmail || !testEmail}
            >
              {testingEmail && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {testingEmail ? "Sending..." : "Send Test"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
