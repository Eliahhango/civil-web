# Website Issues Audit

Date: March 17, 2026
Scope: Full repository review for template customization readiness

## Critical Issues

1. Duplicate CMS backend code in two locations:
- `api/cms/`
- `functions/api/cms/`
Issue: same logic in two places creates drift and maintenance risk.

2. Unused alternate homepage version:
- Active: `/elitech/home-version-2/`
- Also present: `/elitech/home-version-3/`
Issue: unused version adds confusion and deployment bloat.

3. Irrelevant marketplace script content:
- `assets/js/theme-panel.js`
Issue: contains unrelated template marketplace links/code not aligned with this site.

## High Priority Issues

4. WordPress export legacy files still shipped in static deployment:
- `/elitech/wp-includes/`
- plugin/theme-generated bulk files under `/elitech/wp-content/`
Issue: extra payload and unnecessary surface area.

5. Deployment structure ambiguity:
- Root redirects to `/elitech/home-version-2/`
- Mixed root + `/elitech/` content model
Issue: unclear canonical structure and avoidable complexity.

6. Backend target unclear:
- Vercel API, Firebase Functions, and CMS runtime all present
- `elitech/cms/backend.json` is effectively unconfigured
Issue: uncertain source-of-truth API path.

7. Excessive CSS/JS loading per page:
- Many Elementor/WordPress assets loaded across all pages
Issue: performance overhead and difficult customization.

8. Template-generated inline CSS duplication:
Issue: repeated inline styles increase file size and reduce maintainability.

## Medium Priority Issues

9. Naming/structure consistency gaps:
- Mixed page/section naming styles and taxonomy organization
Issue: harder long-term management.

10. Metadata consistency issues:
- OG/Twitter/canonical patterns not uniformly maintained across pages
Issue: SEO and social sharing inconsistency.

11. Category/tag architecture not tightly connected:
- Category and tag pages exist, but content mapping is uneven
Issue: weak information architecture.

12. Admin security hardening opportunities:
- Admin is hidden and login-protected, but further hardening patterns are advisable (rate limiting, stricter operational controls)
Issue: operational risk under repeated auth attempts.

13. Frontend rendering safety gap in dynamic collection rendering:
Issue: dynamic fields require strict escaping/sanitization in rendering paths.

14. Redirect strategy:
- Root redirect uses temporary behavior where permanent may be intended
Issue: weaker caching/SEO signaling.

## Low Priority Issues

15. WordPress-only references still present in static pages:
- feed/xmlrpc/wp-json references
Issue: noisy legacy references in static delivery context.

16. Media optimization opportunities:
- Incomplete lazy-loading coverage
- No systematic next-gen format strategy
Issue: avoidable bandwidth and LCP impact.

17. Documentation gaps:
- No single root technical README describing architecture, deployment paths, and CMS data flow
Issue: onboarding and maintenance friction.

18. Repository hygiene opportunities:
- Lockfiles/scopes and generated artifacts can be tightened for cleaner source control boundaries.

## Customization Readiness Summary

Current state indicates this is still a template-export style codebase, not yet fully streamlined for long-term custom maintenance.

Before major customization work, prioritize:
1. Decide single backend source of truth.
2. Remove duplicate code and unused template remnants.
3. Simplify asset pipeline and reduce global payload.
4. Normalize metadata, taxonomy, and routing conventions.
5. Add minimal project documentation for structure + deployment.
