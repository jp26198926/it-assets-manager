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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateCompanyDetails } from "@/lib/actions/settings";
import type { AppSettingsSerialized } from "@/lib/models/types";
import { Loader2, Building2 } from "lucide-react";

interface CompanyDetailsFormProps {
  settings: AppSettingsSerialized;
  currentUser?: { name: string };
}

export function CompanyDetailsForm({
  settings,
  currentUser,
}: CompanyDetailsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: settings.companyName,
    companyEmail: settings.companyEmail || "",
    companyPhone: settings.companyPhone || "",
    companyAddress: settings.companyAddress || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateCompanyDetails({
        ...formData,
        updatedBy: currentUser?.name,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: "Company details updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update company details",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Details
        </CardTitle>
        <CardDescription>
          Manage your organization's information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              required
              placeholder="Your Company Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail">Company Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={formData.companyEmail}
              onChange={(e) =>
                setFormData({ ...formData, companyEmail: e.target.value })
              }
              placeholder="contact@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyPhone">Phone Number</Label>
            <Input
              id="companyPhone"
              type="tel"
              value={formData.companyPhone}
              onChange={(e) =>
                setFormData({ ...formData, companyPhone: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              value={formData.companyAddress}
              onChange={(e) =>
                setFormData({ ...formData, companyAddress: e.target.value })
              }
              placeholder="123 Main St, City, State, ZIP"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
