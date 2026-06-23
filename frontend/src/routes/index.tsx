import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/landing/Chrome";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { UseCases } from "@/components/landing/UseCases";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "Bubblespace — Team chat that floats" },
            {
                name: "description",
                content:
                    "Bubblespace is the calm, beautiful messaging app for organizations. Channels, DMs, files, voice — all in one delightful place.",
            },
            { property: "og:title", content: "Bubblespace — Team chat that floats" },
            {
                property: "og:description",
                content:
                    "The calm, beautiful messaging app for organizations. Channels, DMs, files, voice — all in one delightful place.",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
            },
        ],
    }),
    component: Index,
});

function Index() {
    return (
        <div className="relative min-h-screen flex flex-col bg-background">
            <Nav />
            <main className="flex-1 w-full">
                <Hero />
                <Features />
                <HowItWorks />
                <UseCases />
                <FAQ />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
