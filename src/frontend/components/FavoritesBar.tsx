import { useNavigate } from "react-router-dom";
import { useFavorites } from "../stores/favorites";
import { useRecentlyVisited } from "../hooks/useRecentlyVisited";
import { getServiceLabel } from "../types/services";
import ServiceIcon from "./ServiceIcon";

/**
 * The squid-ink favorites strip under the top bar, as in the AWS console
 * ("Control Tower | AWS Organizations | IAM | …"). Lists the starred services;
 * like the console, it is not shown until something is starred.
 */
export default function FavoritesBar() {
  const navigate = useNavigate();
  const favorites = useFavorites((s) => s.favorites);

  const open = (key: string) => {
    useRecentlyVisited.getState().addVisited(key);
    navigate(`/services/${key}`);
  };

  if (favorites.length === 0) return null;

  return (
    <nav className="fd-favorites-bar" aria-label="Favorite services">
      {favorites.map((key) => (
          <a
            key={key}
            href={`/#/services/${key}`}
            className="fd-favorites-item"
            onClick={(e) => {
              e.preventDefault();
              open(key);
            }}
          >
            <ServiceIcon serviceKey={key} />
            {getServiceLabel(key)}
          </a>
      ))}
    </nav>
  );
}
