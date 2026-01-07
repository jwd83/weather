// WMO Weather Code to Emoji Mapping
const weatherCodeToEmoji = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌫️',
    51: '🌧️',
    53: '🌧️',
    55: '🌧️',
    56: '🌧️',
    57: '🌧️',
    61: '🌧️',
    63: '🌧️',
    65: '🌧️',
    66: '🌧️',
    67: '🌧️',
    71: '❄️',
    73: '❄️',
    75: '❄️',
    77: '❄️',
    80: '🌦️',
    81: '🌦️',
    82: '🌦️',
    85: '🌨️',
    86: '🌨️',
    95: '⛈️',
    96: '⛈️',
    99: '⛈️'
};

// WMO Weather Code to Description Mapping
const weatherCodeToDescription = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
};

// Chart instances
let tempChart, precipChart, windChart;

// Get DOM elements
const searchBtn = document.getElementById('searchBtn');
const coordsBtn = document.getElementById('coordsBtn');
const cityInput = document.getElementById('cityInput');
const latInput = document.getElementById('latInput');
const lonInput = document.getElementById('lonInput');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const weatherContainer = document.getElementById('weatherContainer');

// Event listeners
searchBtn.addEventListener('click', searchByCity);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchByCity();
});

coordsBtn.addEventListener('click', () => {
    const lat = parseFloat(latInput.value);
    const lon = parseFloat(lonInput.value);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        showError('Please enter valid coordinates (Lat: -90 to 90, Lon: -180 to 180)');
        return;
    }
    fetchWeather(lat, lon);
});

// Search city using Nominatim API
async function searchByCity() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading(true);
    hideError();

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const displayName = data[0].display_name.split(',')[0];

            latInput.value = lat;
            lonInput.value = lon;

            await fetchWeather(lat, lon, displayName);
        } else {
            showError('City not found. Please try another name or enter coordinates manually.');
            showLoading(false);
        }
    } catch (error) {
        showError('Failed to search for city. Please try again.');
        showLoading(false);
    }
}

// Fetch weather data from Open-Meteo API
async function fetchWeather(lat, lon, locationName = 'Location') {
    showLoading(true);
    hideError();

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,precipitation_probability,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.reason || 'Failed to fetch weather data');
        }

        showLoading(false);
        weatherContainer.classList.remove('hidden');
        updateUI(data, locationName);
    } catch (error) {
        showError('Failed to fetch weather data. Please try again.');
        showLoading(false);
    }
}

// Update UI with weather data
function updateUI(data, locationName) {
    // Update location and date
    document.getElementById('locationName').textContent = locationName;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update current weather
    const current = data.current;
    const weatherCode = current.weather_code;
    document.getElementById('currentEmoji').textContent = weatherCodeToEmoji[weatherCode] || '🌡️';
    document.getElementById('currentTemp').textContent = Math.round(current.temperature_2m);
    document.getElementById('weatherDescription').textContent = weatherCodeToDescription[weatherCode] || 'Unknown';
    document.getElementById('feelsLikeValue').textContent = Math.round(current.apparent_temperature);
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure)} hPa`;

    // Update today's high/low
    document.getElementById('todayHigh').textContent = `${Math.round(data.daily.temperature_2m_max[0])}°`;
    document.getElementById('todayLow').textContent = `${Math.round(data.daily.temperature_2m_min[0])}°`;

    // Update charts
    updateCharts(data);

    // Update 7-day forecast
    updateForecast(data.daily);
}

// Update all charts
function updateCharts(data) {
    // Destroy existing charts
    if (tempChart) tempChart.destroy();
    if (precipChart) precipChart.destroy();
    if (windChart) windChart.destroy();

    // Temperature Chart (24-hour)
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const temps = data.hourly.temperature_2m.slice(0, 24);
    const tempTimes = data.hourly.time.slice(0, 24).map(t => {
        const date = new Date(t);
        return date.getHours() + ':00';
    });

    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: tempTimes,
            datasets: [{
                label: 'Temperature (°C)',
                data: temps,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Precipitation Chart (7-day)
    const precipCtx = document.getElementById('precipChart').getContext('2d');
    const precipData = data.daily.precipitation_probability_max;
    const precipDays = data.daily.time.map(t => {
        const date = new Date(t);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });

    precipChart = new Chart(precipCtx, {
        type: 'bar',
        data: {
            labels: precipDays,
            datasets: [{
                label: 'Precipitation Probability (%)',
                data: precipData,
                backgroundColor: 'rgba(118, 75, 162, 0.7)',
                borderColor: 'rgba(118, 75, 162, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Wind Speed Chart (24-hour)
    const windCtx = document.getElementById('windChart').getContext('2d');
    const windData = data.hourly.wind_speed_10m.slice(0, 24);

    windChart = new Chart(windCtx, {
        type: 'line',
        data: {
            labels: tempTimes,
            datasets: [{
                label: 'Wind Speed (km/h)',
                data: windData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update 7-day forecast cards
function updateForecast(daily) {
    const forecastContainer = document.getElementById('forecastCards');
    forecastContainer.innerHTML = '';

    daily.time.forEach((date, index) => {
        if (index === 0) return; // Skip today (already shown)

        const weatherCode = daily.weather_code[index];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="day">${dayName}</div>
            <div style="font-size: 0.9rem; opacity: 0.9;">${formattedDate}</div>
            <div class="weather-emoji">${weatherCodeToEmoji[weatherCode] || '🌡️'}</div>
            <div class="temps">
                <span>${Math.round(daily.temperature_2m_max[index])}°</span> / 
                <span>${Math.round(daily.temperature_2m_min[index])}°</span>
            </div>
            <div class="precip">
                💧 ${daily.precipitation_probability_max[index]}%
            </div>
        `;
        forecastContainer.appendChild(card);
    });
}

// Show/hide loading state
function showLoading(show) {
    if (show) {
        loadingEl.classList.remove('hidden');
        weatherContainer.classList.add('hidden');
    } else {
        loadingEl.classList.add('hidden');
    }
}

// Show error message
function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
}

// Hide error message
function hideError() {
    errorEl.classList.add('hidden');
}

// Load default location on page load
window.addEventListener('load', () => {
    const defaultLat = 51.5074; // London
    const defaultLon = -0.1278;
    fetchWeather(defaultLat, defaultLon, 'London, UK');
});
