import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Chrome";
import React, { useEffect, useState } from "react";

export const Route = createFileRoute("/status")({
    component: StatusPage,
});

type StatusData = {
    status: string;
    timestamp: string;
    uptime: number;
    services: {
        database: string;
    };
};

function StatusPage() {
    const [status, setStatus] = useState<StatusData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Determine backend root from VITE_API_URL or defaults
                const apiUrl = (import.meta.env.VITE_API_URL as string) || "https://bubble-backend-production-96a0.up.railway.app/api/v1";
                const backendRoot = apiUrl.replace("/api/v1", "");
                
                const res = await fetch(`${backendRoot}/status`);
                if (!res.ok) throw new Error("Failed to retrieve system status");
                const data = await res.json();
                setStatus(data);
            } catch (err: any) {
                setError(err.message || "Could not connect to status API");
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

    const formatUptime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-background text-foreground">
            <Nav />
            <main className="mx-auto max-w-3xl px-6 py-32 flex-1 w-full">
                <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-6">
                    System Status
                </h1>
                <p className="text-sm text-muted-foreground mb-8">Real-time status updates for Bubble Space services.</p>
                
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    {loading ? (
                        <div className="py-8 text-center text-muted-foreground">Checking systems...</div>
                    ) : error ? (
                        <div className="py-8 text-center text-destructive">
                            <p className="font-semibold mb-1">Operational Outage</p>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                    ) : status ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <span className="font-medium text-foreground">All Systems Operational</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    {status.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-card/60 p-4 border border-border/40">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Database</div>
                                    <div className="font-semibold text-foreground capitalize">{status.services.database}</div>
                                </div>
                                <div className="rounded-lg bg-card/60 p-4 border border-border/40">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Server Uptime</div>
                                    <div className="font-semibold text-foreground">{formatUptime(status.uptime)}</div>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground pt-2">
                                Last checked: {new Date(status.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ) : null}
                </div>
            </main>
            <Footer />
        </div>
    );
}
