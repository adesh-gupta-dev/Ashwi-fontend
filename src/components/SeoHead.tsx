import React from 'react';
import Head from 'expo-router/head';

type SeoHeadProps = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
};

/** Route metadata is emitted into each statically rendered web page. */
export function SeoHead({ title, description, path, noIndex = false, structuredData }: SeoHeadProps) {
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const canonical = siteUrl ? `${siteUrl}${path}` : undefined;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Ashwi" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta name="twitter:card" content={siteUrl ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {canonical ? <>
        <link rel="canonical" href={canonical} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${siteUrl}/ashwi-social-card.svg`} />
        <meta name="twitter:image" content={`${siteUrl}/ashwi-social-card.svg`} />
      </> : null}
      {structuredData ? <script type="application/ld+json">{JSON.stringify(structuredData)}</script> : null}
    </Head>
  );
}
