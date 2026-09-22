"""
Geocoding & Reverse Geocoding Service for AquaSentinel
======================================================
Provides live geographic search and reverse-geocoding for Indian regions,
states, districts, cities, and arbitrary geographic coordinates.

Features:
- Primary: OpenStreetMap Nominatim with Indian country filtering (`countrycodes=in`)
- Fallback: Open-Meteo Geocoding Engine
- Resilient timeouts & connection error handling
- In-memory caching (1-hour TTL) to prevent rate limiting
- Zero API keys required
"""

import time
import urllib.request
import urllib.parse
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# In-memory caches: { query_key: (timestamp, data) }
_SEARCH_CACHE: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}
_REVERSE_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}

CACHE_TTL_SECONDS = 3600  # 1 hour TTL
USER_AGENT = "AquaSentinel-DisasterManagement/1.0 (sih26071@gov.in; contact: sih26071@aquasentinel.gov.in)"


class GeocodingService:

    @classmethod
    def search_locations(cls, query: str, limit: int = 6) -> List[Dict[str, Any]]:
        """
        Searches for Indian states, districts, cities, towns, or landmarks matching query.
        Returns a list of standardized location results.
        """
        clean_q = query.strip().lower()
        if not clean_q or len(clean_q) < 2:
            return []

        now = time.time()
        # Check cache
        if clean_q in _SEARCH_CACHE:
            cached_time, cached_results = _SEARCH_CACHE[clean_q]
            if now - cached_time < CACHE_TTL_SECONDS:
                return cached_results

        results: List[Dict[str, Any]] = []

        # 1. Attempt Nominatim with India filter
        try:
            encoded = urllib.parse.quote(query.strip())
            nom_url = f"https://nominatim.openstreetmap.org/search?q={encoded}&countrycodes=in&format=json&limit={limit}&addressdetails=1"
            req = urllib.request.Request(nom_url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for item in data:
                    addr = item.get("address", {})
                    name = (
                        addr.get("city")
                        or addr.get("town")
                        or addr.get("village")
                        or addr.get("municipality")
                        or addr.get("county")
                        or addr.get("state_district")
                        or addr.get("state")
                        or item.get("name")
                        or item.get("display_name", "").split(",")[0]
                    )
                    state = addr.get("state", "")
                    district = addr.get("state_district") or addr.get("county", "")
                    country = addr.get("country", "India")
                    results.append({
                        "name": name,
                        "display_name": item.get("display_name", ""),
                        "district": district,
                        "state": state,
                        "country": country,
                        "latitude": round(float(item["lat"]), 5),
                        "longitude": round(float(item["lon"]), 5),
                        "importance": item.get("importance", 0.0),
                        "type": item.get("type", "location")
                    })
        except Exception as e:
            logger.warning(f"Nominatim search failed for '{query}': {e}. Falling back to Open-Meteo Geocoding.")

        # 2. Fallback to Open-Meteo Geocoding if Nominatim returned 0 results or timed out
        if not results:
            try:
                encoded = urllib.parse.quote(query.strip())
                om_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded}&count={limit}&language=en&format=json"
                req = urllib.request.Request(om_url, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=6) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    om_items = data.get("results", [])
                    # Sort prioritizing Indian locations
                    om_items.sort(key=lambda x: 0 if x.get("country_code", "").upper() == "IN" else 1)
                    for item in om_items:
                        results.append({
                            "name": item.get("name"),
                            "display_name": f"{item.get('name')}, {item.get('admin1', '')}, {item.get('country', '')}".strip(", "),
                            "district": item.get("admin2", ""),
                            "state": item.get("admin1", ""),
                            "country": item.get("country", "India"),
                            "latitude": round(float(item["latitude"]), 5),
                            "longitude": round(float(item["longitude"]), 5),
                            "importance": 0.5,
                            "type": item.get("feature_code", "city")
                        })
            except Exception as e:
                logger.error(f"Open-Meteo geocoding search failed for '{query}': {e}")

        # Store in cache
        _SEARCH_CACHE[clean_q] = (now, results)
        return results

    @classmethod
    def reverse_geocode(cls, lat: float, lon: float) -> Dict[str, Any]:
        """
        Reverse-geocodes latitude and longitude to the nearest meaningful Indian locality,
        district, and state.
        """
        cache_key = f"{round(lat, 3)}_{round(lon, 3)}"
        now = time.time()

        if cache_key in _REVERSE_CACHE:
            cached_time, cached_data = _REVERSE_CACHE[cache_key]
            if now - cached_time < CACHE_TTL_SECONDS:
                return cached_data

        result: Dict[str, Any] = {
            "status": "success",
            "name": f"{round(lat, 4)}°N, {round(lon, 4)}°E",
            "display_name": f"Coordinates: {round(lat, 4)}°N, {round(lon, 4)}°E",
            "city": None,
            "district": None,
            "state": None,
            "country": "India",
            "latitude": round(lat, 5),
            "longitude": round(lon, 5)
        }

        try:
            nom_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&zoom=10"
            req = urllib.request.Request(nom_url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                addr = data.get("address", {})
                city = (
                    addr.get("city")
                    or addr.get("town")
                    or addr.get("village")
                    or addr.get("municipality")
                    or addr.get("suburb")
                )
                district = addr.get("state_district") or addr.get("county")
                state = addr.get("state")
                country = addr.get("country", "India")

                primary_name = city or district or state or f"{round(lat, 4)}°N, {round(lon, 4)}°E"

                result = {
                    "status": "success",
                    "name": primary_name,
                    "display_name": data.get("display_name", f"{primary_name}, India"),
                    "city": city,
                    "district": district,
                    "state": state,
                    "country": country,
                    "latitude": round(lat, 5),
                    "longitude": round(lon, 5)
                }
        except Exception as e:
            logger.warning(f"Reverse geocoding failed for ({lat}, {lon}): {e}")

        _REVERSE_CACHE[cache_key] = (now, result)
        return result

    @classmethod
    def get_latest_radar_timestamp(cls) -> Dict[str, Any]:
        """
        Retrieves the latest available precipitation radar tile timestamp from RainViewer.
        """
        try:
            url = "https://api.rainviewer.com/public/weather-maps.json"
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                radar_frames = data.get("radar", {}).get("past", [])
                if radar_frames:
                    latest = radar_frames[-1]
                    tile_path = latest.get("path")
                    timestamp = latest.get("time")
                    host = data.get("host", "https://tilecache.rainviewer.com")
                    tile_url_template = f"{host}{tile_path}/256/{{z}}/{{x}}/{{y}}/2/1_1.png"
                    return {
                        "status": "success",
                        "timestamp": timestamp,
                        "time_iso": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(timestamp)),
                        "tile_url": tile_url_template,
                        "source": "RainViewer Real-Time Radar Network"
                    }
        except Exception as e:
            logger.error(f"Failed to fetch RainViewer radar timestamp: {e}")

        # Fallback to empty if unavailable
        return {
            "status": "error",
            "message": "Radar tile service temporarily unavailable",
            "tile_url": None
        }
