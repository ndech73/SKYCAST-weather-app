import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/pages/RadarPage.css';

var weatherLayerDefs = [
  { 
    key: 'temp_new', 
    name: 'Temperature', 
    icon: '🌡️',
    legend: [
      { color: '#821692', label: '-40°C', description: 'Extreme Cold' },
      { color: '#0000CD', label: '-30°C', description: 'Severe Cold' },
      { color:  '#1E90FF', label: '-20°C', description: 'Very Cold' },
      { color:  '#00BFFF', label: '-10°C', description: 'Cold' },
      { color: '#00FFFF', label: '0°C', description: 'Freezing' },
      { color:  '#7FFF00', label: '10°C', description: 'Cool' },
      { color: '#ADFF2F', label: '15°C', description: 'Mild' },
      { color:  '#FFFF00', label: '20°C', description: 'Warm' },
      { color:  '#FFD700', label: '25°C', description: 'Pleasant' },
      { color: '#FFA500', label: '30°C', description: 'Hot' },
      { color: '#FF4500', label: '35°C', description: 'Very Hot' },
      { color:  '#DC143C', label: '40°C', description: 'Extreme Heat' },
      { color: '#8B0000', label: '50°C+', description: 'Dangerous Heat' },
    ],
    unit: 'Celsius (°C)'
  },
  { 
    key: 'clouds_new', 
    name: 'Cloud Cover', 
    icon: '☁️',
    legend:  [
      { color: '#87CEEB', label: '0%', description: 'Clear Sky' },
      { color: '#B0C4DE', label: '10%', description: 'Mostly Clear' },
      { color:  '#A9A9A9', label: '25%', description: 'Partly Cloudy' },
      { color: '#808080', label: '50%', description: 'Cloudy' },
      { color:  '#696969', label: '75%', description: 'Mostly Cloudy' },
      { color: '#505050', label: '90%', description: 'Overcast' },
      { color:  '#303030', label: '100%', description: 'Complete Cover' },
    ],
    unit: 'Cloud Coverage (%)'
  },
  { 
    key: 'precipitation_new', 
    name:  'Precipitation', 
    icon: '🌧️',
    legend: [
      { color: '#E8F5E9', label: '0', description: 'No Rain' },
      { color: '#00E400', label: '0. 1', description: 'Light Drizzle' },
      { color: '#A8E05F', label: '0.5', description: 'Light Rain' },
      { color:  '#FFFF00', label: '1', description: 'Moderate Rain' },
      { color: '#FFBF00', label: '2', description: 'Rain' },
      { color: '#FF8000', label: '4', description: 'Heavy Rain' },
      { color: '#FF0000', label: '8', description: 'Very Heavy Rain' },
      { color: '#BF0000', label: '14', description: 'Intense Rain' },
      { color:  '#800080', label: '20', description:  'Extreme Rain' },
      { color:  '#4B0082', label: '40+', description: 'Torrential' },
    ],
    unit:  'Rainfall (mm/h)'
  },
  { 
    key: 'wind_new', 
    name:  'Wind Speed', 
    icon: '💨',
    legend: [
      { color: '#E0F7FA', label: '0', description: 'Calm' },
      { color: '#AEF1F9', label: '1', description: 'Light Air' },
      { color: '#96F7DC', label: '5', description: 'Light Breeze' },
      { color: '#96F7B4', label: '10', description:  'Gentle Breeze' },
      { color: '#6FF46F', label: '15', description: 'Moderate Breeze' },
      { color: '#73ED12', label: '20', description:  'Fresh Breeze' },
      { color: '#A4ED12', label: '25', description:  'Strong Breeze' },
      { color: '#DAED12', label: '30', description: 'Near Gale' },
      { color: '#EDC212', label: '40', description: 'Gale' },
      { color: '#ED8F12', label: '50', description:  'Strong Gale' },
      { color: '#ED6312', label: '60', description:  'Storm' },
      { color: '#ED2912', label: '80', description: 'Violent Storm' },
      { color: '#D5102D', label: '100+', description: 'Hurricane Force' },
    ],
    unit: 'Wind Speed (m/s)'
  },
  { 
    key: 'pressure_new', 
    name:  'Pressure', 
    icon: '🌀',
    legend: [
      { color: '#0000CD', label: '940', description: 'Very Low (Storm)' },
      { color: '#1E90FF', label: '960', description: 'Low Pressure' },
      { color:  '#00BFFF', label: '980', description: 'Below Normal' },
      { color:  '#87CEEB', label: '1000', description: 'Normal Low' },
      { color: '#98FB98', label: '1010', description: 'Normal' },
      { color: '#ADFF2F', label: '1020', description: 'Normal High' },
      { color: '#FFFF00', label: '1030', description: 'Above Normal' },
      { color:  '#FFA500', label: '1040', description: 'High Pressure' },
      { color:  '#FF4500', label: '1050+', description: 'Very High' },
    ],
    unit:  'Pressure (hPa)'
  },
];

var mapStyles = [
  { 
    key: 'light', 
    name: 'Light', 
    icon: '🗺️',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  { 
    key: 'dark', 
    name: 'Dark', 
    icon: '🌙',
    url:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  { 
    key: 'satellite', 
    name: 'Satellite', 
    icon:  '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  },
  { 
    key: 'terrain', 
    name: 'Terrain', 
    icon:  '⛰️',
    url:  'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap'
  },
];

function buildWeatherUrl(lat, lon) {
  var params = new URLSearchParams();
  params.set('lat', lat);
  params.set('lon', lon);
  return '/api/weather?' + params.toString();
}

function buildTileUrl(layerKey) {
  var params = new URLSearchParams();
  params.set('layer', layerKey);
  return '/api/weather/tile-url?' + params.toString();
}

function buildGeocodingUrl(query) {
  var params = new URLSearchParams();
  params.set('q', query);
  params.set('format', 'jsonv2');
  params.set('accept-language', 'en');
  params.set('limit', '1');
  return 'https://nominatim.openstreetmap.org/search?' + params.toString();
}

function fetchWeatherAndAQ(lat, lon) {
  var url = buildWeatherUrl(lat, lon);
  console.log('Fetching weather from:', url);
  return fetch(url).then(function(resp) {
    if (!resp.ok) throw new Error('Backend weather fetch failed');
    return resp.json();
  });
}

function fetchLayerTileUrl(layerKey) {
  var url = buildTileUrl(layerKey);
  console.log('Fetching tile URL from:', url);
  return fetch(url).then(function(resp) {
    if (!resp.ok) {
      console.error('HTTP Error:', resp.status, resp.statusText);
      return null;
    }
    return resp.json();
  }).then(function(data) {
    if (!data || !data. success) {
      console.error('Failed to fetch tile URL:', data ?  data.error : 'No data');
      return null;
    }
    console.log('Tile URL received:', data.url);
    return data.url;
  }).catch(function(err) {
    console.error('Error fetching tile URL:', err);
    return null;
  });
}

function MapViewUpdater(props) {
  var map = useMap();
  useEffect(function() {
    map.setView(props.center, props.zoom, { animate: true });
  }, [props.center, props.zoom, map]);
  return null;
}

function SidebarLegend(props) {
  var layer = props.layer;
  if (!layer) return null;

  return (
    <div className="sidebar-legend">
      <div className="sidebar-legend-header">
        <span className="sidebar-legend-icon">{layer.icon}</span>
        <span className="sidebar-legend-title">{layer.name}</span>
      </div>
      <div className="sidebar-legend-unit">{layer.unit}</div>
      <div className="sidebar-legend-items">
        {layer.legend. map(function(item, index) {
          return (
            <div key={index} className="sidebar-legend-item">
              <div className="sidebar-legend-color" style={{ backgroundColor: item.color }}></div>
              <span className="sidebar-legend-value">{item.label}</span>
              <span className="sidebar-legend-desc">{item.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapLegendOverlay(props) {
  var layer = props.layer;
  if (!layer) return null;

  return (
    <div className="map-legend-overlay">
      <div className="map-legend-header">
        <span>{layer.icon}</span>
        <span>{layer.name}</span>
      </div>
      <div className="map-legend-bar">
        {layer.legend. map(function(item, index) {
          return (
            <div 
              key={index} 
              className="map-legend-segment"
              style={{ backgroundColor: item.color }}
              title={item.label + ' - ' + item.description}
            ></div>
          );
        })}
      </div>
      <div className="map-legend-labels">
        <span>{layer.legend[0] ?  layer.legend[0].label :  ''}</span>
        <span className="map-legend-unit-label">{layer.unit}</span>
        <span>{layer.legend[layer.legend.length - 1] ? layer.legend[layer.legend.length - 1].label :  ''}</span>
      </div>
    </div>
  );
}

function RadarPage() {
  var mapCenterState = useState([20, 0]);
  var mapCenter = mapCenterState[0];
  var setMapCenter = mapCenterState[1];

  var mapZoomState = useState(3);
  var mapZoom = mapZoomState[0];
  var setMapZoom = mapZoomState[1];

  var searchQueryState = useState('');
  var searchQuery = searchQueryState[0];
  var setSearchQuery = searchQueryState[1];

  var weatherState = useState(null);
  var weather = weatherState[0];
  var setWeather = weatherState[1];

  var errorState = useState('');
  var error = errorState[0];
  var setError = errorState[1];

  var mapStyleState = useState('light');
  var mapStyle = mapStyleState[0];
  var setMapStyle = mapStyleState[1];

  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var activeOverlayState = useState(null);
  var activeOverlay = activeOverlayState[0];
  var setActiveOverlay = activeOverlayState[1];

  var tileUrlState = useState(null);
  var tileUrl = tileUrlState[0];
  var setTileUrl = tileUrlState[1];

  var tileLoadingState = useState(false);
  var tileLoading = tileLoadingState[0];
  var setTileLoading = tileLoadingState[1];

  var activeLayerDef = null;
  for (var i = 0; i < weatherLayerDefs.length; i++) {
    if (weatherLayerDefs[i]. key === activeOverlay) {
      activeLayerDef = weatherLayerDefs[i];
      break;
    }
  }

  var currentMapStyle = mapStyles[0];
  for (var j = 0; j < mapStyles.length; j++) {
    if (mapStyles[j].key === mapStyle) {
      currentMapStyle = mapStyles[j];
      break;
    }
  }

  useEffect(function() {
    if (! activeOverlay) {
      setTileUrl(null);
      return;
    }

    setTileLoading(true);
    setError('');

    fetchLayerTileUrl(activeOverlay).then(function(url) {
      if (url) {
        setTileUrl(url);
      } else {
        setError('Failed to load weather layer.');
      }
      setTileLoading(false);
    }).catch(function(err) {
      console.error(err);
      setError('Failed to load weather layer.');
      setTileLoading(false);
    });
  }, [activeOverlay]);

  function handleSearch(e) {
    e.preventDefault();
    if (! searchQuery. trim()) return;
    setError('');
    setWeather(null);
    setLoading(true);

    var geoUrl = buildGeocodingUrl(searchQuery);
    console.log('Geocoding URL:', geoUrl);

    fetch(geoUrl, {
      headers: { 
        'Accept-Language': 'en', 
        'User-Agent':  'SkyCastApp/1.0' 
      }
    }).then(function(res) {
      if (!res.ok) {
        throw new Error('Geocoding failed:  ' + res.status);
      }
      return res.json();
    }).then(function(data) {
      console.log('Geocoding result:', data);

      if (! data || data.length === 0) {
        setError('City not found.');
        setLoading(false);
        return Promise.reject('City not found');
      }

      var lat = data[0].lat;
      var lon = data[0].lon;
      var displayName = data[0].display_name;
      console.log('Coordinates:', lat, lon);
      
      setMapCenter([parseFloat(lat), parseFloat(lon)]);
      setMapZoom(8);

      return fetchWeatherAndAQ(lat, lon).then(function(weatherData) {
        console.log('Weather data:', weatherData);
        weatherData.display_name = displayName;
        setWeather(weatherData);
        setLoading(false);
      });
    }).catch(function(err) {
      console.error('Search error:', err);
      if (err !== 'City not found') {
        setError('Could not load weather.');
      }
      setLoading(false);
    });
  }

  function toggleOverlay(layerKey) {
    if (activeOverlay === layerKey) {
      setActiveOverlay(null);
    } else {
      setActiveOverlay(layerKey);
    }
  }

  return (
    <div className="radar-page">
      <header className="radar-header">
        <h1>🌍 SkyCast Weather Radar</h1>
        <p className="radar-subtitle">Real-time global weather visualization</p>
      </header>

      <div className="radar-content">
        <aside className="radar-sidebar-minimal">
          <form className="weather-search-bar" onSubmit={handleSearch}>
            <input
              placeholder="Search city..."
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target. value); }}
              disabled={loading}
              spellCheck={false}
            />
            <button type="submit" disabled={loading}>
              {loading ? '⏳' : '🔍'}
            </button>
          </form>

          <div className="map-style-section">
            <div className="section-title">🗺️ Map Style</div>
            <div className="map-style-buttons">
              {mapStyles.map(function(style) {
                return (
                  <button
                    key={style.key}
                    className={'map-style-btn' + (mapStyle === style.key ? ' active' : '')}
                    onClick={function() { setMapStyle(style.key); }}
                    title={style.name}
                  >
                    <span className="style-icon">{style.icon}</span>
                    <span className="style-name">{style. name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="layers-section">
            <div className="section-title">🌦️ Weather Layers</div>
            <div className="layer-buttons">
              {weatherLayerDefs.map(function(layer) {
                return (
                  <button
                    key={layer.key}
                    className={'layer-toggle-btn' + (activeOverlay === layer.key ? ' active' : '')}
                    onClick={function() { toggleOverlay(layer.key); }}
                    disabled={tileLoading}
                  >
                    <span className="layer-icon">{layer.icon}</span>
                    <span className="layer-name">{layer.name}</span>
                    {tileLoading && activeOverlay === layer.key ?  (
                      <span className="layer-loading">⏳</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {error ?  <div className="sidebar-error">⚠️ {error}</div> : null}

          <SidebarLegend layer={activeLayerDef} />

          {weather ?  (
            <div className="weather-card">
              <div className="weather-card-header">
                <h2>
                  {weather.location && weather.location.name 
                    ? weather.location.name 
                    : (weather.display_name ?  weather.display_name. split(',')[0] : 'Unknown')}
                </h2>
                <span className="weather-card-country">
                  {weather.location ?  weather.location.country : ''}
                </span>
              </div>
              <div className="weather-card-body">
                <div className="weather-row">
                  <span>🌡️ Temperature</span>
                  <b>{weather.temp}°C</b>
                </div>
                <div className="weather-row">
                  <span>💧 Humidity</span>
                  <b>{weather.humidity}%</b>
                </div>
                <div className="weather-row">
                  <span>💨 Wind Speed</span>
                  <b>{weather.wind} m/s</b>
                </div>
                <div className="weather-row">
                  <span>☁️ Cloud Cover</span>
                  <b>{weather.cloud}%</b>
                </div>
                <div className="weather-row">
                  <span>🌫️ Air Quality</span>
                  <b className={'aqi-' + weather.aqi}>{weather.aqi_label}</b>
                </div>
              </div>
            </div>
          ) : null}
        </aside>

        <main className="radar-main">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            zoomControl={false}
            className="leaflet-minimal"
          >
            <TileLayer
              key={currentMapStyle.key}
              url={currentMapStyle.url}
              attribution={currentMapStyle.attribution}
            />

            {tileUrl ? (
              <TileLayer
                key={tileUrl}
                url={tileUrl}
                attribution="Weather © OpenWeatherMap"
                opacity={0.85}
                zIndex={100}
              />
            ) : null}

            <MapViewUpdater center={mapCenter} zoom={mapZoom} />
            <ZoomControl position="bottomright" />
          </MapContainer>

          <MapLegendOverlay layer={activeLayerDef} />

          {activeLayerDef ? (
            <div className="active-layer-badge">
              {activeLayerDef.icon} {activeLayerDef. name}
            </div>
          ) : null}

          <div className="map-style-badge">
            {currentMapStyle.icon} {currentMapStyle.name}
          </div>
        </main>
      </div>
    </div>
  );
}

export default RadarPage;