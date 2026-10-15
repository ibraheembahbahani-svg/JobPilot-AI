import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'JobPilot AI', description: 'A consent-first job discovery and application workspace.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
