import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import type { LocationSuggestion } from "../types";
import { logger } from "../../../utils/logger";

interface UseLocationSearchOptions {
  enabled: boolean;
  debounceMs?: number;
}

export function useLocationSearch({
  enabled,
  debounceMs = 1000,
}: UseLocationSearchOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce location search
  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        searchLocations(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, enabled, debounceMs]);

  const searchLocations = async (query: string) => {
    setIsLoading(true);
    try {
      const results = await Location.geocodeAsync(query);

      if (results.length > 0) {
        const locationSuggestions: LocationSuggestion[] = [];

        // Limit to 3 results to reduce API calls
        for (let i = 0; i < Math.min(results.length, 3); i++) {
          const result = results[i];
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });

            if (address) {
              const cityName = address.city || address.subregion || "";
              const regionName = address.region || "";
              const countryName = address.country || "";

              if (cityName) {
                let displayName = cityName;
                if (regionName && countryName) {
                  displayName = `${cityName}, ${regionName}, ${countryName}`;
                } else if (regionName) {
                  displayName = `${cityName}, ${regionName}`;
                } else if (countryName) {
                  displayName = `${cityName}, ${countryName}`;
                }

                if (!locationSuggestions.some((s) => s.displayName === displayName)) {
                  locationSuggestions.push({
                    name: cityName,
                    region: regionName,
                    country: countryName,
                    displayName,
                  });
                }
              }
            }
          } catch (error: any) {
            // Silently skip this result if reverse geocoding fails
          }
        }

        setSuggestions(locationSuggestions);
        setShowSuggestions(locationSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error: any) {
      // Handle rate limit errors gracefully
      if (error.message && error.message.includes("rate limit")) {
        // Rate limit reached, please wait before searching again
      } else {
        logger.error("Location search error:", error);
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const selectLocation = useCallback((suggestion: LocationSuggestion) => {
    let locationString = "";
    if (suggestion.name && suggestion.region) {
      locationString = `${suggestion.name}, ${suggestion.region}`;
    } else if (suggestion.name && suggestion.country) {
      locationString = `${suggestion.name}, ${suggestion.country}`;
    } else {
      locationString = suggestion.name;
    }

    setSearchQuery(locationString);
    setShowSuggestions(false);
    setSuggestions([]);

    return locationString;
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    isLoading,
    selectLocation,
    clearSearch,
  };
}
