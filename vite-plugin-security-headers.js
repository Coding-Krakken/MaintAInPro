// Vite plugin to inject security headers for static preview/build
export default function securityHeaders() {
  return {
    name: 'vite-plugin-security-headers',
    configureServer(server) {
      // Do not set CSP in dev to avoid blocking Codespaces and dev environment resources.
      // Security headers are only injected for static/prod builds below.
    },
    transformIndexHtml(html, ctx) {
      // Only inject CSP meta tags for production/static builds
      if (ctx && ctx.server) {
        // In dev, do not inject CSP meta tags
        return html;
      }
      // In build (static/prod), inject strict CSP meta tags
      return html.replace(
        /<head>/,
        `<head>\n  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src *; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';">\n  <meta http-equiv="X-Frame-Options" content="DENY">\n  <meta http-equiv="X-XSS-Protection" content="1; mode=block">\n  <meta http-equiv="X-Content-Type-Options" content="nosniff">`
      );
    },
  };
}
