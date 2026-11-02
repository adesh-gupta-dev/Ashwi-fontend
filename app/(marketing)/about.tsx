import React from 'react';
import { AboutScreen } from '@/screens/marketing/AboutScreen';
import { SeoHead } from '@/components/SeoHead';

export default function AboutRoute() {
  return <><SeoHead title="About Ashwi | How Our AI Workspace Works" description="Learn how Ashwi combines profession-aware AI assistants, Google Gemini, conversation history, and a React Native workspace built by Adesh Gupta and Saloni Singh." path="/about" /><AboutScreen /></>;
}
