import React, { useState, useEffect, useRef } from 'react';
import { 
  IoMapOutline, 
  IoLayersOutline,
  IoLocationOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoExpand
} from 'react-icons/io5';
import { WiRain, WiCloudy, WiWindy, WiDaySunny } from 'react-icons/wi';

const MobileRadar = () => {
  const [selectedLayer, setSelectedLayer] = useState('temperature');
  const [mapStyle, setMapStyle] = useState('default');
  const [location, setLocation] = useState({ lat: -1.286389, lng: 36.817223 }); // Nairobi
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);

  const layers = [
    { id: 'temperature', name: 'Temperature', icon: <WiDaySunny />, color: '#FF6B6B' },
    { id: 'precipitation', name: 'Precipitation', icon: <WiRain />, color: '#4ECDC4' },
    { id: 'clouds', name: 'Clouds', icon: <WiCloudy />, color: '#95E1D3' },
    { id: 'wind', name: 'Wind Speed', icon: <WiWindy />, color: '#FFD93D' },
  ];

  const mapStyles = [
    { id: 'default', name: 'Default' },
    { id: 'satellite', name: 'Satellite' },
    { id: 'terrain', name: 'Terrain' },
  ];

  useEffect(() => {
    // Initialize map (simplified - you can integrate real map library)
    initializeMap();
  }, []);

  const initializeMap = () => {
    // This is a placeholder - integrate with Leaflet or Google Maps
    console.log('Map initialized at:', location);
  };

  const handleLayerChange = (layerId) => {
    setSelectedLayer(layerId);
    console.log('Layer changed to:', layerId);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          alert('Unable to get location: ' + error.message);
        }
      );
    }
  };

  return (
    <div className="mobile-radar">
      {/* Header */}
      <div className="mobile-radar-header">
        <div className="mobile-section-header" style={{ marginBottom: '0' }}>
          <h2 className="mobile-section-title">
            <IoMapOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Weather Radar
          </h2>
          <div className="mobile-radar-actions">
            <button className="mobile-radar-action-btn" onClick={getCurrentLocation}>
              <IoLocationOutline />
            </button>
            <button className="mobile-radar-action-btn" onClick={handleRefresh}>
              <IoRefreshOutline className={loading ? 'rotating' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Layer Selection */}
      <div className="mobile-radar-layers">
        <div className="mobile-layers-title">
          <IoLayersOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Select Layer
        </div>
        <div className="mobile-layers-grid">
          {layers.map((layer) => (
            <button
              key={layer.id}
              className={`mobile-layer-btn ${selectedLayer === layer.id ? 'active' : ''}`}
              onClick={() => handleLayerChange(layer.id)}
              style={{ '--layer-color': layer.color }}
            >
              <span className="mobile-layer-icon">{layer.icon}</span>
              <span className="mobile-layer-name">{layer.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="mobile-map-container">
        <div ref={mapRef} className="mobile-map">
          {/* Map placeholder - integrate with Leaflet or Google Maps */}
          <div className="mobile-map-placeholder">
            <IoMapOutline style={{ fontSize: '4rem', color: '#cbd5e0' }} />
            <p style={{ color: '#718096', marginTop: '1rem' }}>
              Map view for {layers.find(l => l.id === selectedLayer)?.name}
            </p>
            <p style={{ color: '#a0aec0', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="mobile-map-controls">
          <button className="mobile-map-control-btn">
            <IoExpand />
          </button>
        </div>
      </div>

      {/* Map Style Selection */}
      <div className="mobile-map-styles">
        <div className="mobile-styles-title">Map Style</div>
        <div className="mobile-styles-grid">
          {mapStyles.map((style) => (
            <button
              key={style.id}
              className={`mobile-style-btn ${mapStyle === style.id ? 'active' : ''}`}
              onClick={() => setMapStyle(style.id)}
            >
              {style.name}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mobile-radar-legend">
        <div className="mobile-legend-title">Legend</div>
        <div className="mobile-legend-items">
          {selectedLayer === 'temperature' && (
            <>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#0000FF' }}></div>
                <span>Cold (&lt; 0°C)</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#00FFFF' }}></div>
                <span>Cool (0-15°C)</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#00FF00' }}></div>
                <span>Mild (15-25°C)</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#FFFF00' }}></div>
                <span>Warm (25-30°C)</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#FF0000' }}></div>
                <span>Hot (&gt; 30°C)</span>
              </div>
            </>
          )}
          {selectedLayer === 'precipitation' && (
            <>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#E0F7FA' }}></div>
                <span>Light</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#4DD0E1' }}></div>
                <span>Moderate</span>
              </div>
              <div className="mobile-legend-item">
                <div className="mobile-legend-color" style={{ background: '#0097A7' }}></div>
                <span>Heavy</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileRadar;