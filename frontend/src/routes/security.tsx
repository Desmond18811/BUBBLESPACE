import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Chrome";
import React from "react";

export const Route = createFileRoute("/security")({
    component: SecurityPage,
});

function SecurityPage() {
    return (
        <div className="relative min-h-screen flex flex-col bg-background text-foreground">
            <Nav />
            <main className="mx-auto max-w-3xl px-6 py-32 flex-1 w-full">
                <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-6">
                    Security Policy
                </h1>
                <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>
                <div className="space-y-6 text-foreground/80 leading-relaxed">
                    <p>
                        At Bubble Space, we prioritize the protection and security of your organization's data above all else.
                    </p>
                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Multi-Tenant Isolation</h2>
                    <p>
                        Every organization has its own isolated namespace partition in our Pinecone database and a strict metadata filtering layer to guarantee zero cross-tenant information leakage.
                    </p>
                    <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Encryption</h2>
                    <p>
                        Data is encrypted in transit using Transport Layer Security (TLS) and at rest. Communications and encryption keys are rotated periodically following industry best practices.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
