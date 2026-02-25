import React, { useState, useEffect } from 'react';
import { weatherAPI } from '../../scripts/weatherAPI';
import { 
  IoStatsChartOutline,
  IoWaterOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoCalendarOutline
} from 'react-icons/io5';
import { 
  WiThermometer, 
  WiRaindrops,
  WiDaySunny,
  WiCloudy,
  WiRain,
  WiThunderstorm,
  WiDayCloudy
} from 'react-icons/wi';

const MobileHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');

  useEffect(() => {
    loadHistory();
  }, [selectedPeriod]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '14days' ? 14 : 30;
      
      // Generate mock historical data for demo
      const history = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 86400000).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        temp_high: Math.round(25 + Math.random() * 10),
        temp_low: Math.round(15 + Math.random() * 5),
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
        humidity: Math.round(50 + Math.random() * 30),
        rainfall: Math.random() * 20,
      }));
      
      setHistoryData(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'Sunny': return <WiDaySunny />;
      case 'Cloudy': return <WiCloudy />;
      case 'Rainy': return <WiRain />;
      case 'Partly Cloudy': return <WiDayCloudy />;
      default: return <WiDaySunny />;
    }
  };

  if (loading) {
    return (
      <div className="mobile-loading">
        <div className="mobile-loading-spinner"></div>
        <p className="mobile-loading-text">Loading history...</p>
      </div>
    );
  }

  const avgTemp = Math.round(historyData.reduce((sum, d) => sum + d.temp_high, 0) / historyData.length);
  const avgHumidity = Math.round(historyData.reduce((sum, d) => sum + d.humidity, 0) / historyData.length);
  const totalRainfall = historyData.reduce((sum, d) => sum + d.rainfall, 0).toFixed(1);

  return (
    <div className="mobile-history">
      {/* Header */}
      <div className="mobile-section-header" style={{ marginBottom: '1rem' }}>
        <h2 className="mobile-section-title">
          <IoStatsChartOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Weather History
        </h2>
      </div>

      {/* Period Selector */}
      <div className="mobile-period-selector">
        <button 
          className={`mobile-period-btn ${selectedPeriod === '7days' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('7days')}
        >
          7 Days
        </button>
        <button 
          className={`mobile-period-btn ${selectedPeriod === '14days' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('14days')}
        >
          14 Days
        </button>
        <button 
          className={`mobile-period-btn ${selectedPeriod === '30days' ? 'active' : ''}`}
          onClick={() => setSelectedPeriod('30days')}
        >
          30 Days
        </button>
      </div>

      {/* Summary Cards */}
      <div className="mobile-history-summary">
        <div className="mobile-summary-card">
          <div className="mobile-summary-icon">
            <WiThermometer />
          </div>
          <div className="mobile-summary-info">
            <div className="mobile-summary-label">Avg Temperature</div>
            <div className="mobile-summary-value">{avgTemp}°C</div>
          </div>
        </div>

        <div className="mobile-summary-card">
          <div className="mobile-summary-icon">
            <IoWaterOutline />
          </div>
          <div className="mobile-summary-info">
            <div className="mobile-summary-label">Avg Humidity</div>
            <div className="mobile-summary-value">{avgHumidity}%</div>
          </div>
        </div>

        <div className="mobile-summary-card">
          <div className="mobile-summary-icon">
            <WiRaindrops />
          </div>
          <div className="mobile-summary-info">
            <div className="mobile-summary-label">Total Rainfall</div>
            <div className="mobile-summary-value">{totalRainfall} mm</div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="mobile-history-list">
        <h3 className="mobile-history-subtitle">
          <IoCalendarOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Daily Records
        </h3>
        
        {historyData.map((day, index) => (
          <div key={index} className="mobile-history-item">
            <div className="mobile-history-date">
              <div className="mobile-history-day">{day.date}</div>
              <div className="mobile-history-condition-icon">
                {getWeatherIcon(day.condition)}
              </div>
            </div>

            <div className="mobile-history-temps">
              <div className="mobile-history-temp-high">
                <IoArrowUpOutline className="mobile-temp-arrow" />
                {day.temp_high}°
              </div>
              <div className="mobile-history-temp-low">
                <IoArrowDownOutline className="mobile-temp-arrow" />
                {day.temp_low}°
              </div>
            </div>

            <div className="mobile-history-details-small">
              <span title="Humidity">
                <IoWaterOutline style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '2px' }} />
                {day.humidity}%
              </span>
              {day.rainfall > 0 && (
                <span title="Rainfall">
                  <WiRaindrops style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '2px' }} />
                  {day.rainfall.toFixed(1)}mm
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Simple Chart Visualization */}
      <div className="mobile-chart-section">
        <h3 className="mobile-history-subtitle">
          <IoStatsChartOutline style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Temperature Trend
        </h3>
        <div className="mobile-simple-chart">
          {historyData.slice(-7).map((day, index) => (
            <div key={index} className="mobile-chart-bar">
              <div 
                className="mobile-chart-bar-fill"
                style={{ 
                  height: `${(day.temp_high / 40) * 100}%`,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)'
                }}
              ></div>
              <div className="mobile-chart-label">{day.date.split(' ')[1]}</div>
            </div>
          ))}
        </div>
        <div className="mobile-chart-legend">
          <div className="mobile-chart-legend-item">
            <div className="mobile-chart-legend-color" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}></div>
            <span>High Temperature</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileHistory;