export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  humidity?: number;
  feelsLike?: number;
}

/**
 * Fetch weather data for a given city using Open-Meteo API (free, no API key required)
 * First geocodes the city name, then fetches weather data
 */
export async function fetchWeatherForCity(cityName: string): Promise<WeatherData | null> {
  try {
    // Extract just the city name (remove state abbreviation like "Winchester, VA" -> "Winchester")
    const cleanCityName = cityName.split(",")[0].trim();

    // Step 1: Geocode the city name to get coordinates
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCityName)}&count=1&language=en&format=json`;

    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      return null;
    }

    const { latitude, longitude } = geocodeData.results[0];

    // Step 2: Fetch weather data using coordinates
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code&temperature_unit=fahrenheit&timezone=auto`;

    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      return null;
    }

    const { temperature_2m, relative_humidity_2m, apparent_temperature, weather_code } = weatherData.current;

    // Map WMO weather codes to conditions and icons
    const { condition, icon } = getWeatherCondition(weather_code);

    return {
      temperature: Math.round(temperature_2m),
      condition,
      icon,
      humidity: relative_humidity_2m,
      feelsLike: Math.round(apparent_temperature),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Map WMO weather codes to human-readable conditions and Ionicons
 * Reference: https://open-meteo.com/en/docs
 */
function getWeatherCondition(code: number): { condition: string; icon: string } {
  // Clear sky
  if (code === 0) {
    return { condition: "Clear", icon: "sunny" };
  }

  // Mainly clear, partly cloudy, overcast
  if (code >= 1 && code <= 3) {
    return { condition: "Partly Cloudy", icon: "partly-sunny" };
  }

  // Fog
  if (code >= 45 && code <= 48) {
    return { condition: "Foggy", icon: "cloudy" };
  }

  // Drizzle
  if (code >= 51 && code <= 57) {
    return { condition: "Drizzle", icon: "rainy" };
  }

  // Rain
  if (code >= 61 && code <= 67) {
    return { condition: "Rainy", icon: "rainy" };
  }

  // Snow
  if (code >= 71 && code <= 77) {
    return { condition: "Snow", icon: "snow" };
  }

  // Rain showers
  if (code >= 80 && code <= 82) {
    return { condition: "Rain Showers", icon: "rainy" };
  }

  // Snow showers
  if (code >= 85 && code <= 86) {
    return { condition: "Snow Showers", icon: "snow" };
  }

  // Thunderstorm
  if (code >= 95 && code <= 99) {
    return { condition: "Thunderstorm", icon: "thunderstorm" };
  }

  // Default
  return { condition: "Unknown", icon: "cloud" };
}
