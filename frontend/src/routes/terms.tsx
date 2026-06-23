import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Chrome";
import React from "react";

export const Route = createFileRoute("/terms")({
    component: TermsPage,
});

function TermsPage() {
    return (
        <div className="relative min-h-screen flex flex-col bg-background text-foreground">
            <Nav />
            <main className="mx-auto max-w-3xl px-6 py-32 flex-1 w-full">
                <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-6">
                    Terms of Service
                </h1>
                <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>
                <div className="space-y-6 text-foreground/80 leading-relaxed">
                    <p>
                        Welcome to Bubble Space. By accessing or using our services, you agree to be bound by these Terms of Service.
                    </p>
                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Use of Service</h2>
                    <p>
                        You are responsible for any activity that occurs under your account. You agree to use the service in compliance with all local laws and acceptable use guidelines.
                    </p>
                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Workspace Brain & Intellectual Property</h2>
                    <p>
                        All communication, uploaded files, and transcripts indexed in the Workspace Brain remain the property of their respective organization owners. Bubble Space acts as a processor of this data.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
