"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Search, BookOpen, LogIn } from "lucide-react";
import Link from "next/link";
import { GuestTicketForm } from "./guest-ticket-form";
import { GuestTicketTracker } from "./guest-ticket-tracker";

export function GuestLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">IT Support Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/knowledgebase">
              <Button variant="ghost">
                <BookOpen className="h-4 w-4 mr-2" />
                Knowledge Base
              </Button>
            </Link>
            <Link href="/login">
              <Button>
                <LogIn className="h-4 w-4 mr-2" />
                Staff Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome to IT Support</h2>
            <p className="text-muted-foreground">
              Create a new support ticket or track an existing one
            </p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                <Ticket className="h-4 w-4 mr-2" />
                Create Ticket
              </TabsTrigger>
              <TabsTrigger value="track">
                <Search className="h-4 w-4 mr-2" />
                Track Ticket
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit a Support Request</CardTitle>
                  <CardDescription>
                    Fill out the form below to create a new support ticket.
                    You'll receive a tracking number to check your ticket
                    status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GuestTicketForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="track" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Track Your Ticket</CardTitle>
                  <CardDescription>
                    Enter your ticket number to view the current status of your
                    support request.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GuestTicketTracker />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
