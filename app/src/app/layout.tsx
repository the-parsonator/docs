import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pact — make a pact, prove it with a selfie",
  description:
    "Make a pact with yourself. Stake real money. Send a selfie when you're done. Break it and we charge your card.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-3xl px-4 py-8 sm:py-14">
          <header className="mb-10 flex items-center justify-between">
            <a href="/" className="text-xl font-bold tracking-tight">
              <span className="text-[--color-pact]">●</span> pact
            </a>
            <a
              href="/#how"
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              How it works
            </a>
          </header>
          {children}
          <footer className="mt-20 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
            Pact. Built in the open. Stakes in GBP. By making a pact you agree
            to our terms.
          </footer>
        </div>
      </body>
    </html>
  );
}
