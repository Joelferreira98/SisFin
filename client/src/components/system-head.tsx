import { useEffect } from "react";
import { useSystemSettings } from "@/hooks/use-system-settings";

export function SystemHead() {
  const { settings } = useSystemSettings();

  useEffect(() => {
    // Update document title
    document.title = settings.systemName;

    // Update favicon
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    
    if (settings.systemFavicon) {
      favicon.href = settings.systemFavicon;
    } else {
      // Remove favicon if none is set
      favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📊</text></svg>';
    }

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = settings.systemDescription;

  }, [settings.systemName, settings.systemFavicon, settings.systemDescription]);

  return null;
}