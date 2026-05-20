import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { fetchWeatherForCity, WeatherData } from "../../../utils/weather";

interface UseWeatherOptions {
  userLocation?: string;
  useDeviceLocation: boolean;
  setUserLocation: (location: string) => void;
}

export function useWeather({
  userLocation,
  useDeviceLocation,
  setUserLocation,
}: UseWeatherOptions) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadWeather = useCallback(async () => {
    let locationToUse = userLocation;

    // If useDeviceLocation is enabled, get current device location
    if (useDeviceLocation) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync({});
          const geocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (geocode.length > 0) {
            const city = geocode[0].city || geocode[0].subregion || geocode[0].region;
            if (city) {
              locationToUse = city;
              setDetectedLocation(city);
              // Update stored location if different
              if (city !== userLocation) {
                setUserLocation(city);
              }
            }
          }
        }
      } catch (error) {
        // Silently handle location errors
      }
    }

    if (!locationToUse) {
      return;
    }

    setLoadingWeather(true);
    try {
      const weatherData = await fetchWeatherForCity(locationToUse);
      setWeather(weatherData);
    } catch (error) {
      setWeather(null);
    } finally {
      setLoadingWeather(false);
    }
  }, [userLocation, useDeviceLocation, setUserLocation]);

  useEffect(() => {
    loadWeather();
  }, [loadWeather, refreshKey]);

  // Manual refresh function
  const refreshWeather = useCallback(async () => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    weather,
    loadingWeather,
    detectedLocation,
    refreshWeather,
  };
}
