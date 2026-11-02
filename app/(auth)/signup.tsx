import React from 'react';
import { AuthScreen } from '@/screens/auth/AuthScreen';
import { SeoHead } from '@/components/SeoHead';

export default function SignupRoute() {
  return <><SeoHead title="Create Your Ashwi AI Workspace" description="Create an Ashwi workspace to try profession-aware AI assistants powered by Google Gemini, organize conversations, and focus your work." path="/signup" /><AuthScreen mode="signup" /></>;
}
