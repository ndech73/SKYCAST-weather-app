import React, { useState, useEffect, useRef } from 'react';
import { weatherAPI } from '../../scripts/weatherAPI';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import '../../styles/pages/HistoryPage.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const HistoryPage = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [selectedCity, setSelectedCity] = useState('Nairobi');
  const [chartType, setChartType] = useState('line');
  const navigate = useNavigate();
  const chartRef = useRef(null);

  const metrics = [
    { id: 'temperature', name: 'Temperature', unit: '°C', color: '#f59e0b', gradient: ['#fbbf24', '#f59e0b'], bgColor: 'rgba(245, 158, 11, 0.1)', icon: '🌡️' },
    { id: 'humidity', name: 'Humidity', unit: '%', color: '#3b82f6', gradient: ['#60a5fa', '#3b82f6'], bgColor: 'rgba(59, 130, 246, 0.1)', icon: '💧' },
    { id: 'rainfall', name: 'Rainfall', unit: 'mm', color: '#06b6d4', gradient: ['#22d3ee', '#06b6d4'], bgColor: 'rgba(6, 182, 212, 0.1)', icon: '🌧️' },
    { id: 'windSpeed', name: 'Wind Speed', unit: 'km/h', color: '#8b5cf6', gradient: ['#a78bfa', '#8b5cf6'], bgColor: 'rgba(139, 92, 246, 0.1)', icon: '💨' }
  ];

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line
  }, [timeRange, selectedCity]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      setError(null);

      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      const data = await weatherAPI.getHistoricalWeather(selectedCity, days);

      const formattedData = Array.isArray(data) ? data : data.history || data.data || [];
      setHistoricalData(formattedData);
    } catch (error) {
      setError('Failed to load historical data. Using mock data for demonstration.');
      setHistoricalData(generateMockHistoricalData(timeRange));
    } finally {
      setLoading(false);
    }
  };

  const generateMockHistoricalData = (range) => {
    const data = [];
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 365;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic varying data for each metric
      data.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        temperature: 18 + Math.sin(i * 0.5) * 5 + Math.random() * 4,
        humidity: 55 + Math.cos(i * 0.3) * 15 + Math.random() * 10,
        rainfall: Math.abs(Math.sin(i * 0.7)) * 15 + Math.random() * 8,
        windSpeed: 8 + Math.sin(i * 0.4) * 6 + Math.random() * 5
      });
    }
    return data;
  };

  const getChartData = () => {
    const currentMetric = metrics.find(m => m.id === selectedMetric);
    const chartData = historicalData.slice(-30);
    const labels = chartData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const dataValues = chartData.map(d => d[selectedMetric] || 0);

    // Create gradient if canvas context is available
    let gradientFill = currentMetric.bgColor;
    if (chartRef.current?.canvas) {
      const ctx = chartRef.current.canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, currentMetric.gradient[0] + '60');
      gradient.addColorStop(1, currentMetric.gradient[1] + '10');
      gradientFill = gradient;
    }

    return {
      labels,
      datasets: [
        {
          label: `${currentMetric.name} (${currentMetric.unit})`,
          data: dataValues,
          borderColor: currentMetric.color,
          backgroundColor: gradientFill,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: currentMetric.color,
          pointBorderWidth: 3,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: currentMetric.color,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3,
          borderWidth: 3,
          barPercentage: 0.7,
          categoryPercentage: 0.8
        }
      ]
    };
  };

  const getStatisticalData = () => {
    if (historicalData.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 };
    }
    const values = historicalData.map(d => d[selectedMetric] || 0).filter(v => v !== null && v !== undefined);
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)]
    };
  };

  const getComparisonChartData = () => {
    const currentMetric = metrics.find(m => m.id === selectedMetric);
    const stats = getStatisticalData();
    return {
      labels: ['Min', 'Avg', 'Median', 'Max'],
      datasets: [
        {
          label: currentMetric.name,
          data: [stats.min, stats.avg, stats.median, stats.max],
          backgroundColor: [
            '#3b82f6',
            '#f59e0b',
            '#10b981',
            '#ef4444'
          ],
          borderColor: '#ffffff',
          borderWidth: 3,
          borderRadius: 12,
          barThickness: 60
        }
      ]
    };
  };

  const getMetricDistributionData = () => {
    const values = historicalData.map(d => d[selectedMetric] || 0).filter(v => v !== null && v !== undefined);
    if (values.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Frequency',
          data: [1],
          backgroundColor: ['#94a3b8'],
          borderColor: '#ffffff',
          borderWidth: 4
        }]
      };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const bucketSize = (max - min) / 5 || 1;
    const buckets = [0, 0, 0, 0, 0];
    
    values.forEach(v => {
      const bucketIndex = Math.min(4, Math.floor((v - min) / bucketSize));
      buckets[bucketIndex]++;
    });
    
    return {
      labels: [
        `${min.toFixed(1)}-${(min + bucketSize).toFixed(1)}`,
        `${(min + bucketSize).toFixed(1)}-${(min + 2 * bucketSize).toFixed(1)}`,
        `${(min + 2 * bucketSize).toFixed(1)}-${(min + 3 * bucketSize).toFixed(1)}`,
        `${(min + 3 * bucketSize).toFixed(1)}-${(min + 4 * bucketSize).toFixed(1)}`,
        `${(min + 4 * bucketSize).toFixed(1)}-${max.toFixed(1)}`
      ],
      datasets: [
        {
          label: 'Frequency',
          data: buckets,
          backgroundColor: [
            '#3b82f6',
            '#8b5cf6',
            '#ec4899',
            '#f59e0b',
            '#10b981'
          ],
          borderColor: '#ffffff',
          borderWidth: 4,
          hoverOffset: 15
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          font: { size: 14, weight: '600', family: "'Inter', 'system-ui', sans-serif" },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
          color: '#64748b'
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        titleFont: { size: 14, weight: '600', family: "'Inter', 'system-ui', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', 'system-ui', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const metric = metrics.find(m => m.id === selectedMetric);
            return `${context.parsed.y.toFixed(2)} ${metric.unit}`;
          }
        }
      }
    },
    layout: { padding: { top: 10, right: 10, bottom: 10, left: 10 } },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          drawBorder: false,
          color: 'rgba(148, 163, 184, 0.1)',
          lineWidth: 1
        },
        ticks: {
          font: { size: 12, family: "'Inter', 'system-ui', sans-serif" },
          padding: 10,
          color: '#64748b',
          callback: function(value) {
            return value.toFixed(1);
          }
        }
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          font: { size: 11, family: "'Inter', 'system-ui', sans-serif" },
          maxRotation: 45,
          minRotation: 0,
          color: '#64748b'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  const barChartOptions = {
    ...chartOptions,
    indexAxis: 'x',
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          font: { size: 12, weight: '600', family: "'Inter', 'system-ui', sans-serif" },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12,
          color: '#64748b'
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        titleFont: { size: 14, weight: '600', family: "'Inter', 'system-ui', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', 'system-ui', sans-serif" },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%'
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(historicalData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-history-${selectedCity}-${new Date().getTime()}.json`;
    link.click();
  };

  const handleRefresh = () => {
    fetchHistoricalData();
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
  };

  const getCurrentMetric = () => metrics.find(m => m.id === selectedMetric);
  const stats = getStatisticalData();

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading historical data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h2>📈 Weather History & Trends</h2>
          <p>Analyze past weather patterns and trends for {selectedCity}</p>
        </div>
        <div className="header-actions">
          <button className="export-data-btn" onClick={handleExportData}>
            📥 Export Data
          </button>
          <button className="refresh-btn" onClick={handleRefresh}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="history-controls">
        <div className="control-group">
          <label>Select City:</label>
          <select 
            value={selectedCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="city-select"
          >
            <option value="Nairobi">Nairobi, Kenya</option>
            <option value="Mombasa">Mombasa, Kenya</option>
            <option value="London">London, UK</option>
            <option value="New York">New York, USA</option>
            <option value="Tokyo">Tokyo, Japan</option>
          </select>
        </div>

        <div className="time-range-selector">
          <label>Time Range:</label>
          <div className="time-buttons">
            {['week', 'month', 'year'].map(range => (
              <button
                key={range}
                className={`time-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="metric-selector">
          <label>View Metric:</label>
          <div className="metric-buttons">
            {metrics.map(metric => (
              <button
                key={metric.id}
                className={`metric-btn ${selectedMetric === metric.id ? 'active' : ''}`}
                onClick={() => setSelectedMetric(metric.id)}
                style={{ '--metric-color': metric.color }}
                title={`Click to view ${metric.name} trends`}
              >
                <span className="metric-icon">{metric.icon}</span>
                {metric.name}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-type-selector">
          <label>Chart Type:</label>
          <div className="chart-type-buttons">
            {['line', 'bar'].map(type => (
              <button
                key={type}
                className={`chart-type-btn ${chartType === type ? 'active' : ''}`}
                onClick={() => setChartType(type)}
                title={`View as ${type} chart`}
              >
                {type === 'line' ? '📊' : '📈'} {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
          <button className="dismiss-btn" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="chart-container">
        <div className="chart-header">
          <h3>{getCurrentMetric().icon} {getCurrentMetric().name} Over Time</h3>
          <div className="current-value">
            <span className="value">
              {historicalData.length > 0 
                ? historicalData[historicalData.length - 1][selectedMetric]?.toFixed(1)
                : '--'
              }
            </span>
            <span className="unit">{getCurrentMetric().unit}</span>
          </div>
        </div>
        <div className="chart-visualization">
          {historicalData.length > 0 ? (
            <>
              {chartType === 'line' ? (
                <Line data={getChartData()} options={chartOptions} ref={chartRef} />
              ) : (
                <Bar data={getChartData()} options={barChartOptions} ref={chartRef} />
              )}
            </>
          ) : (
            <div className="no-data-message">
              <div className="no-data-icon">📊</div>
              <p>No historical data available</p>
            </div>
          )}
        </div>
        <div className="chart-info">
          <div className="info-box">
            <span className="info-label">Min</span>
            <span className="info-value">{stats.min.toFixed(1)}</span>
          </div>
          <div className="info-box">
            <span className="info-label">Max</span>
            <span className="info-value">{stats.max.toFixed(1)}</span>
          </div>
          <div className="info-box">
            <span className="info-label">Average</span>
            <span className="info-value">{stats.avg.toFixed(1)}</span>
          </div>
          <div className="info-box">
            <span className="info-label">Median</span>
            <span className="info-value">{stats.median.toFixed(1)}</span>
          </div>
          <div className="info-box">
            <span className="info-label">Trend</span>
            <span className="info-value">{calculateTrend(historicalData, selectedMetric)}</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>📊 Statistical Analysis</h3>
          {historicalData.length > 0 ? (
            <div className="chart-wrapper">
              <Bar data={getComparisonChartData()} options={barChartOptions} />
            </div>
          ) : (
            <p className="no-data-text">No data available</p>
          )}
        </div>
        <div className="analytics-card">
          <h3>🎯 Data Distribution</h3>
          {historicalData.length > 0 ? (
            <div className="chart-wrapper">
              <Doughnut data={getMetricDistributionData()} options={doughnutOptions} />
            </div>
          ) : (
            <p className="no-data-text">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

const calculateTrend = (data, metric) => {
  if (data.length < 2) return '➡️ Stable';
  const validData = data.filter(d => d[metric] !== null && d[metric] !== undefined);
  if (validData.length < 2) return '➡️ Stable';
  const first = validData[0][metric] || 0;
  const last = validData[validData.length - 1][metric] || 0;
  const trend = ((last - first) / (first || 1)) * 100;
  if (trend > 5) return '↗️ Rising';
  if (trend < -5) return '↘️ Falling';
  return '➡️ Stable';
};

export default HistoryPage;