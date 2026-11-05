/** Default Floci mark: a blue rounded square with an "F". */
export const FLOCI_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d4ff"/><stop offset="100%" stop-color="#0073e6"/></linearGradient></defs><rect width="32" height="32" rx="7" fill="url(#g)"/><text x="16" y="23" font-size="20" font-weight="bold" fill="#fff" text-anchor="middle" font-family="Arial,sans-serif">F</text></svg>'
)}`;

export interface Brand {
  /** Short name: side-nav header, mobile title, logo alt text. */
  name: string;
  /** Top-bar title; undefined when a custom logo is shown on its own (as the AWS console does). */
  title: string | undefined;
  logo: string;
}

/**
 * Top-bar branding. Defaults to Floci; a local `.env.local` can set
 * `VITE_BRAND_NAME` and `VITE_BRAND_LOGO` (a URL or a path under `public/`)
 * to rebrand a personal install. Nothing brand-specific ships in the repo.
 */
type BrandEnv = { VITE_BRAND_NAME?: string; VITE_BRAND_LOGO?: string };

export function getBrand(env: BrandEnv = import.meta.env as BrandEnv): Brand {
  const name = env.VITE_BRAND_NAME?.trim();
  const logo = env.VITE_BRAND_LOGO?.trim();
  return {
    name: name || "Floci",
    title: logo ? undefined : name || "Floci Dash",
    logo: logo || FLOCI_LOGO_SVG,
  };
}
