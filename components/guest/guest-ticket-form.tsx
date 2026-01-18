"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createGuestTicket } from "@/lib/actions/tickets";
import { Loader2, CheckCircle2 } from "lucide-react";
import { TicketPriority } from "@/lib/models/types";
import { GuestRichTextEditor } from "./guest-rich-text-editor";

const CATEGORIES = [
  "Hardware Issue",
  "Software Issue",
  "Network Problem",
  "Access Request",
  "Other",
];

export function GuestTicketForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [formStartTime, setFormStartTime] = useState<number>(0);
  const [mathAnswer, setMathAnswer] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Generate random math problem
  const [mathProblem, setMathProblem] = useState({
    num1: 0,
    num2: 0,
    answer: 0,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
    category: "",
    priority: "medium" as TicketPriority,
  });

  // Initialize form start time and math problem
  useEffect(() => {
    setFormStartTime(Date.now());
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setMathProblem({ num1, num2, answer: num1 + num2 });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check honeypot (should be empty)
      if (honeypot) {
        // Silent fail for bots
        setLoading(false);
        return;
      }

      // Check time-based verification (minimum 3 seconds)
      const timeSpent = Date.now() - formStartTime;
      if (timeSpent < 3000) {
        toast({
          title: "Please slow down",
          description: "Please take your time to fill out the form",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verify math answer
      if (parseInt(mathAnswer) !== mathProblem.answer) {
        toast({
          title: "Verification Failed",
          description: "Please answer the math question correctly",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Upload attachments first if any
      const uploadedAttachments = [];
      for (const file of attachments) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "tickets");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.success && data.url) {
          uploadedAttachments.push({
            filename: file.name,
            url: data.url,
            size: file.size,
            type: file.type,
          });
        }
      }

      const result = await createGuestTicket({
        ...formData,
        attachments: uploadedAttachments,
        formStartTime,
      });

      if (result.success && result.ticketNumber) {
        setTicketNumber(result.ticketNumber);
        setSuccess(true);
        toast({
          title: "Ticket Created Successfully",
          description: `Your ticket number is ${result.ticketNumber}. Please save this for tracking.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create ticket",
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

  const handleReset = () => {
    setSuccess(false);
    setTicketNumber("");
    setAttachments([]);
    setMathAnswer("");
    setHoneypot("");
    setFormStartTime(Date.now());
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setMathProblem({ num1, num2, answer: num1 + num2 });
    setFormData({
      name: "",
      email: "",
      title: "",
      description: "",
      category: "",
      priority: "medium",
    });
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-500/10 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">Ticket Created!</h3>
          <p className="text-muted-foreground mb-4">
            Your support ticket has been created successfully.
          </p>
          <div className="bg-muted p-4 rounded-lg inline-block">
            <p className="text-sm text-muted-foreground mb-1">Ticket Number</p>
            <p className="text-2xl font-mono font-bold">{ticketNumber}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Please save this ticket number. You can use it to track your ticket
            status.
          </p>
        </div>
        <Button onClick={handleReset}>Create Another Ticket</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            disabled={loading}
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Issue Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={loading}
          placeholder="Brief description of your issue"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value })
            }
            required
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) =>
              setFormData({ ...formData, priority: value as TicketPriority })
            }
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <GuestRichTextEditor
          content={formData.description}
          onChange={(html) => setFormData({ ...formData, description: html })}
          onAttachmentsChange={setAttachments}
          placeholder="Please provide detailed information about your issue..."
        />
      </div>

      {/* Honeypot field - hidden from users but visible to bots */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          name="website"
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Math CAPTCHA */}
      <div className="space-y-2">
        <Label htmlFor="mathAnswer">
          Verification: What is {mathProblem.num1} + {mathProblem.num2}? *
        </Label>
        <Input
          id="mathAnswer"
          type="number"
          value={mathAnswer}
          onChange={(e) => setMathAnswer(e.target.value)}
          required
          disabled={loading}
          placeholder="Enter the answer"
          className="max-w-50"
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Submit Ticket
      </Button>
    </form>
  );
}
