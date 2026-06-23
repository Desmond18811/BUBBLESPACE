import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Chrome";
import React from "react";

export const Route = createFileRoute("/privacy")({
    component: PrivacyPage,
});

function PrivacyPage() {
    return (
        <div className="relative min-h-screen flex flex-col bg-background text-foreground">
            <Nav />
            <main className="mx-auto max-w-3xl px-6 py-32 flex-1 w-full">
                <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-6">
                    Privacy Policy
                </h1>
                <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>
                <div className="space-y-6 text-foreground/80 leading-relaxed">
                    <p>
                        Your privacy is important to us. Bubble Space collects and processes minimal user data required for real-time chat, AI context generation, and calendar integrations.
                    </p>
                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Information We Collect</h2>
                    <p>
                        We collect information you provide directly to us when creating an account, uploading files to the Workspace Brain, or connecting calendar events. This includes name, email address, profile avatar, and credentials needed for secure communication.
                    </p>
                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">How We Use Information</h2>
                    <p>
                        Your data is strictly used to run the platform, index workspace information for RAG (retrieval-augmented generation) queries, and enable secure team communication. We do not sell, rent, or lease user data to third parties.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
