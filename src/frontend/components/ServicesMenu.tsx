import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORY_ORDER, SERVICE_CATEGORY_MAP, getServiceLabel } from "../types/services";
import { useFavorites } from "../stores/favorites";
import { useRecentlyVisited } from "../hooks/useRecentlyVisited";
import ServiceIcon from "./ServiceIcon";

const RECENT = "Recently visited";
const FAVORITES = "Favorites";
const ALL = "All services";

interface Props {
  /** Service keys Floci reports (from /_floci/health). */
  serviceKeys: string[];
}

/**
 * The "Services" button of the AWS console top bar and its menu: groups on the
 * left (recently visited, favorites, all services, categories), services on the right.
 */
export default function ServicesMenu({ serviceKeys }: Props) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(RECENT);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const recentlyVisited = useRecentlyVisited((s) => s.recentlyVisited);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current!.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const available = new Set(serviceKeys);
  const byLabel = (a: string, b: string) => getServiceLabel(a).localeCompare(getServiceLabel(b));
  const categories = [...CATEGORY_ORDER, "Other"].filter((cat) =>
    serviceKeys.some((k) => (SERVICE_CATEGORY_MAP[k] || "Other") === cat),
  );
  const groups = [RECENT, FAVORITES, ALL, ...categories];

  const servicesFor = (g: string): string[] => {
    if (g === RECENT) return recentlyVisited.filter((k) => available.has(k));
    if (g === FAVORITES) return favorites.filter((k) => available.has(k));
    if (g === ALL) return [...serviceKeys].sort(byLabel);
    return serviceKeys.filter((k) => (SERVICE_CATEGORY_MAP[k] || "Other") === g).sort(byLabel);
  };
  const shown = servicesFor(group);

  const go = (key: string) => {
    setOpen(false);
    useRecentlyVisited.getState().addVisited(key);
    navigate(`/services/${key}`);
  };

  return (
    <div ref={rootRef} className="fd-services-menu">
      <button
        type="button"
        className={`fd-services-button${open ? " fd-services-button--open" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Services"
        title="Services"
        onClick={() => setOpen((o) => !o)}
      >
        {/* The console shows only a 3×3 grid icon for the services menu. */}
        <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
          {[1, 6, 11].flatMap((y) => [1, 6, 11].map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="0.5" fill="currentColor" />))}
        </svg>
      </button>
      {open && (
        <div className="fd-services-panel" role="dialog" aria-label="Services">
          <ul className="fd-services-groups">
            {groups.map((g) => (
              <li key={g}>
                <button
                  type="button"
                  className={g === group ? "fd-services-group fd-services-group--active" : "fd-services-group"}
                  onClick={() => setGroup(g)}
                >
                  {g}
                </button>
              </li>
            ))}
          </ul>
          <div className="fd-services-list">
            <h2 className="fd-services-heading">{group}</h2>
            {shown.length === 0 ? (
              <p className="fd-services-empty">
                {group === FAVORITES
                  ? "No favorites yet. Star a service to add it."
                  : group === RECENT
                    ? "No recently visited services."
                    : "No services available."}
              </p>
            ) : (
              <ul className="fd-services-grid">
                {shown.map((key) => {
                  const fav = favorites.includes(key);
                  return (
                    <li key={key} className="fd-services-entry">
                      <button
                        type="button"
                        className="fd-services-star"
                        aria-label={fav ? `Remove ${getServiceLabel(key)} from favorites` : `Add ${getServiceLabel(key)} to favorites`}
                        aria-pressed={fav}
                        onClick={() => toggleFavorite(key)}
                      >
                        {fav ? "★" : "☆"}
                      </button>
                      <a
                        href={`/#/services/${key}`}
                        className="fd-services-link"
                        onClick={(e) => {
                          e.preventDefault();
                          go(key);
                        }}
                      >
                        <ServiceIcon serviceKey={key} size={20} />
                        {getServiceLabel(key)}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
