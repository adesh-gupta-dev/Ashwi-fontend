import React from 'react';
import { HomeScreen } from '@/screens/marketing/HomeScreen';
import { SeoHead } from '@/components/SeoHead';

const homeDescription = 'Ashwi is an AI workspace with profession-aware assistants, Google Gemini conversations, and saved chat history for focused work across web, Android, and iOS.';

export default function Index() {
  return <><SeoHead title="Ashwi AI | Your Profession-Aware AI Workspace" description={homeDescription} path="/" structuredData={{
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ashwi',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, Android, iOS',
    description: homeDescription,
    creator: [
      { '@type': 'Person', name: 'Adesh Gupta' },
      { '@type': 'Person', name: 'Saloni Singh' },
    ],
  }} /><HomeScreen /></>;
}
