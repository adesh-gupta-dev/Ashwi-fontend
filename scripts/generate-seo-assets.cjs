const fs = require('node:fs');
const path = require('node:path');

const outputDir = path.resolve(process.argv[2] || 'dist/web');
const siteUrl = 'https://chatwithashwi.vercel.app';
const publicPages = ['/', '/about', '/signup'];

if (!fs.existsSync(outputDir)) {
  process.stderr.write(`SEO export directory does not exist: ${outputDir}\n`);
  process.exitCode = 1;
} else {
  const sitemapLine = siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : '';
  fs.writeFileSync(path.join(outputDir, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /chat\nDisallow: /login\nDisallow: /forgot-password\nDisallow: /reset-password\n${sitemapLine}`);

  if (siteUrl) {
    const entries = publicPages.map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`).join('\n');
    fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
  } else {
    process.stdout.write('EXPO_PUBLIC_SITE_URL is unset; robots.txt was written and sitemap.xml was skipped.\n');
  }
}
