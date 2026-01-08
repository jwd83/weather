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
let tempChart, precipHourlyChart, windChart;

// Radar map instance
let radarMap = null;
let radarLayer = null;

// Current hour line animation
let currentHourLineOpacity = 1;
let opacityDirection = -1;
let animationFrameId = null;

// Minute update tracking
let positionUpdateInterval = null;
let lastWeatherFetch = Date.now();
const WEATHER_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

function animateCurrentHourLine() {
    currentHourLineOpacity += opacityDirection * 0.02;
    if (currentHourLineOpacity <= 0.3) {
        currentHourLineOpacity = 0.3;
        opacityDirection = 1;
    } else if (currentHourLineOpacity >= 1) {
        currentHourLineOpacity = 1;
        opacityDirection = -1;
    }
    
    if (tempChart) tempChart.update('none');
    if (windChart) windChart.update('none');
    
    animationFrameId = requestAnimationFrame(animateCurrentHourLine);
}

function getCurrentHourPosition(times) {
    const now = new Date();
    const currentHour = now.getHours();
    const minutes = now.getMinutes();
    const ampm = currentHour >= 12 ? 'PM' : 'AM';
    const hour12 = currentHour % 12 || 12;
    const currentLabel = `${hour12}${ampm}`;
    const hourIndex = times.indexOf(currentLabel);
    if (hourIndex < 0) return -1;
    return hourIndex + (minutes / 60);
}

function minuteUpdate(tempTimes) {
    // Update "Now" line position
    const newPos = getCurrentHourPosition(tempTimes);
    if (newPos >= 0 && tempChart && windChart) {
        const tempAnnotation = tempChart.options.plugins.annotation.annotations.nowLine;
        const windAnnotation = windChart.options.plugins.annotation.annotations.nowLine;
        if (tempAnnotation) {
            tempAnnotation.xMin = newPos;
            tempAnnotation.xMax = newPos;
        }
        if (windAnnotation) {
            windAnnotation.xMin = newPos;
            windAnnotation.xMax = newPos;
        }
    }
    
    // Refresh weather data if stale
    if (Date.now() - lastWeatherFetch >= WEATHER_REFRESH_INTERVAL && lastQuery) {
        lastWeatherFetch = Date.now();
        fetchWeather(lastQuery.lat, lastQuery.lon, lastQuery.locationName, {
            countryCode: lastQuery.countryCode
        });
    }
}

const UNIT_STORAGE_KEY = 'weatherApp.unitPreference';
const LOCATION_STORAGE_KEY = 'weatherApp.lastLocation';
const DEFAULT_UNIT = 'c';
let lastQuery = null;

// Get DOM elements
const searchBtn = document.getElementById('searchBtn');
const coordsBtn = document.getElementById('coordsBtn');
const cityInput = document.getElementById('cityInput');
const latInput = document.getElementById('latInput');
const lonInput = document.getElementById('lonInput');
const unitToggleF = document.getElementById('unitToggleF');
const unitToggleC = document.getElementById('unitToggleC');
const tabCity = document.getElementById('tabCity');
const tabCoords = document.getElementById('tabCoords');
const panelCity = document.getElementById('panelCity');
const panelCoords = document.getElementById('panelCoords');
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
    fetchWeather(lat, lon, 'Location', { resolveLocation: true });
});

function setActiveTab(tab) {
    if (!tabCity || !tabCoords || !panelCity || !panelCoords) return;
    const isCity = tab === 'city';

    tabCity.classList.toggle('active', isCity);
    tabCoords.classList.toggle('active', !isCity);
    tabCity.setAttribute('aria-selected', String(isCity));
    tabCoords.setAttribute('aria-selected', String(!isCity));
    panelCity.hidden = !isCity;
    panelCoords.hidden = isCity;
}

if (tabCity && tabCoords && panelCity && panelCoords) {
    tabCity.addEventListener('click', () => setActiveTab('city'));
    tabCoords.addEventListener('click', () => setActiveTab('coords'));
    setActiveTab('city');
}

if (unitToggleF && unitToggleC) {
    unitToggleF.addEventListener('click', () => setUserUnitAndRefresh('f'));
    unitToggleC.addEventListener('click', () => setUserUnitAndRefresh('c'));
    applyUnitToggleUI(getUserUnitPreference() || DEFAULT_UNIT);
}

function normalizeUnit(unit) {
    if (unit === 'f' || unit === 'c') return unit;
    return null;
}

function getUserUnitPreference() {
    try {
        const unit = localStorage.getItem(UNIT_STORAGE_KEY);
        return normalizeUnit(unit);
    } catch {
        return null;
    }
}

function setUserUnitPreference(unit) {
    try {
        localStorage.setItem(UNIT_STORAGE_KEY, unit);
    } catch {
        // Ignore storage errors
    }
}

function getSavedLocation() {
    try {
        const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // Ignore storage errors
    }
    return null;
}

function saveLocation(lat, lon, locationName, countryCode) {
    try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
            lat, lon, locationName, countryCode
        }));
    } catch {
        // Ignore storage errors
    }
}

function getAutoUnitForCountry(countryCode) {
    if (!countryCode) return null;
    return countryCode.toLowerCase() === 'us' ? 'f' : 'c';
}

function getUnitToUse(countryCode, explicitUnit) {
    const normalizedExplicit = normalizeUnit(explicitUnit);
    if (normalizedExplicit) return normalizedExplicit;

    const userPreference = getUserUnitPreference();
    if (userPreference) return userPreference;

    return getAutoUnitForCountry(countryCode) || DEFAULT_UNIT;
}

function applyUnitToggleUI(unit) {
    const resolvedUnit = normalizeUnit(unit) || DEFAULT_UNIT;
    const isF = resolvedUnit === 'f';

    unitToggleF.classList.toggle('active', isF);
    unitToggleC.classList.toggle('active', !isF);
    unitToggleF.setAttribute('aria-pressed', String(isF));
    unitToggleC.setAttribute('aria-pressed', String(!isF));
}

function setUserUnitAndRefresh(unit) {
    const resolvedUnit = normalizeUnit(unit);
    if (!resolvedUnit) return;

    setUserUnitPreference(resolvedUnit);
    applyUnitToggleUI(resolvedUnit);

    if (!lastQuery) return;
    fetchWeather(lastQuery.lat, lastQuery.lon, lastQuery.locationName, {
        countryCode: lastQuery.countryCode,
        unit: resolvedUnit
    });
}

function formatLocationName(address, displayName) {
    if (!address) {
        return typeof displayName === 'string' ? displayName.split(',')[0] : 'Location';
    }

    const city = address.city || address.town || address.village || address.municipality || address.hamlet;
    const countryCode = address.country_code ? String(address.country_code).toLowerCase() : null;

    if (countryCode === 'us') {
        const state = address.state;
        const locality = city || address.suburb || address.neighbourhood || address.county;
        if (locality && state) return `${locality}, ${state}`;
        if (locality) return locality;
        if (state) return state;
    }

    const country = address.country;
    if (city && country) return `${city}, ${country}`;
    if (city) return city;

    return typeof displayName === 'string' ? displayName.split(',')[0] : 'Location';
}

async function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const countryCode = data?.address?.country_code ? String(data.address.country_code).toLowerCase() : null;
    const displayName = formatLocationName(data?.address, data?.display_name);

    return { countryCode, displayName };
}

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
        let url;
        // Check if input is a 5-digit US zip code
        if (/^\d{5}$/.test(city)) {
            url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&postalcode=${city}&countrycodes=us&limit=1`;
        } else {
            url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(city)}&limit=1`;
        }
        
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            const displayName = formatLocationName(result?.address, result?.display_name);
            const countryCode = result?.address?.country_code ? String(result.address.country_code).toLowerCase() : null;

            latInput.value = lat;
            lonInput.value = lon;

            await fetchWeather(lat, lon, displayName, { countryCode });
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
async function fetchWeather(lat, lon, locationName = 'Location', options = {}) {
    showLoading(true);
    hideError();

    let resolvedLocationName = locationName;
    let countryCode = options.countryCode || null;

    if (options.resolveLocation) {
        try {
            const resolved = await reverseGeocode(lat, lon);
            if (resolved) {
                countryCode = countryCode || resolved.countryCode;
                if (resolvedLocationName === 'Location') {
                    resolvedLocationName = resolved.displayName || resolvedLocationName;
                }
            }
        } catch {
            // Ignore reverse-geocode errors
        }
    }

    const unit = getUnitToUse(countryCode, options.unit);
    if (unitToggleF && unitToggleC) applyUnitToggleUI(unit);

    lastQuery = {
        lat,
        lon,
        locationName: resolvedLocationName,
        countryCode
    };

    saveLocation(lat, lon, resolvedLocationName, countryCode);

    const temperatureUnitParam = unit === 'f' ? 'fahrenheit' : 'celsius';
    const windSpeedUnitParam = unit === 'f' ? 'mph' : 'kmh';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=${temperatureUnitParam}&wind_speed_unit=${windSpeedUnitParam}&precipitation_unit=mm&timezone=auto&forecast_days=11`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.reason || 'Failed to fetch weather data');
        }

        showLoading(false);
        lastWeatherFetch = Date.now();
        weatherContainer.classList.remove('hidden');
        updateUI(data, resolvedLocationName);
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
    const tempUnit = data?.current_units?.temperature_2m || '°C';
    const windUnit = data?.current_units?.wind_speed_10m || 'km/h';
    const pressureUnit = data?.current_units?.surface_pressure || 'hPa';
    const weatherCode = current.weather_code;
    document.getElementById('currentEmoji').textContent = weatherCodeToEmoji[weatherCode] || '🌡️';
    document.getElementById('currentTemp').textContent = Math.round(current.temperature_2m);
    document.getElementById('currentTempUnit').textContent = tempUnit;
    document.getElementById('weatherDescription').textContent = weatherCodeToDescription[weatherCode] || 'Unknown';
    document.getElementById('feelsLikeValue').textContent = Math.round(current.apparent_temperature);
    document.getElementById('feelsLikeUnit').textContent = tempUnit;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed_10m)} ${windUnit}`;
    document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure)} ${pressureUnit}`;

    // Update today's high/low
    document.getElementById('todayHigh').textContent = `${Math.round(data.daily.temperature_2m_max[0])}°`;
    document.getElementById('todayLow').textContent = `${Math.round(data.daily.temperature_2m_min[0])}°`;

    // Update charts
    updateCharts(data);

    // Update 7-day forecast
    updateForecast(data.daily);

    // Update radar map
    updateRadarMap(lastQuery.lat, lastQuery.lon);
}

// Update all charts
function updateCharts(data) {
    // Stop existing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Destroy existing charts
    if (tempChart) tempChart.destroy();
    if (precipHourlyChart) precipHourlyChart.destroy();
    if (windChart) windChart.destroy();

    // Temperature Chart (48-hour)
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const temps = data.hourly.temperature_2m.slice(0, 48);
    const tempTimes = data.hourly.time.slice(0, 48).map(t => {
        const date = new Date(t);
        const hour = date.getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}${ampm}`;
    });

    const tempUnit = data?.hourly_units?.temperature_2m || '°C';
    const windUnit = data?.hourly_units?.wind_speed_10m || 'km/h';
    
    const currentHourPos = getCurrentHourPosition(tempTimes);
    
    // Find where tomorrow starts (first 12AM after index 0)
    const tomorrowStartIdx = tempTimes.findIndex((t, i) => i > 0 && t === '12AM');
    
    const chartAnnotations = {
        todayBox: {
            type: 'box',
            xMin: 0,
            xMax: tomorrowStartIdx > 0 ? tomorrowStartIdx : 24,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderWidth: 0,
            label: {
                display: true,
                content: 'Today',
                position: { x: 'start', y: 'start' },
                color: 'rgba(255, 255, 255, 0.4)',
                font: { size: 12, weight: 'bold' },
                padding: 4
            }
        },
        tomorrowBox: {
            type: 'box',
            xMin: tomorrowStartIdx > 0 ? tomorrowStartIdx : 24,
            xMax: 48,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderWidth: 0,
            label: {
                display: true,
                content: 'Tomorrow',
                position: { x: 'start', y: 'start' },
                color: 'rgba(255, 255, 255, 0.4)',
                font: { size: 12, weight: 'bold' },
                padding: 4
            }
        }
    };
    
    if (currentHourPos >= 0) {
        chartAnnotations.nowLine = {
            type: 'line',
            xMin: currentHourPos,
            xMax: currentHourPos,
            borderColor: () => `rgba(255, 100, 100, ${currentHourLineOpacity})`,
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
                display: true,
                content: 'Now',
                position: 'start',
                backgroundColor: () => `rgba(255, 100, 100, ${currentHourLineOpacity})`,
                color: 'white',
                font: { size: 10, weight: 'bold' }
            }
        };
    }

    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: tempTimes,
            datasets: [{
                label: `Temperature (${tempUnit})`,
                data: temps,
                borderColor: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                },
                annotation: {
                    annotations: chartAnnotations
                }
            },
            scales: {
                x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    beginAtZero: false,
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: tempUnit, color: '#a0a0a0' }
                }
            }
        }
    });

    // Wind Speed Chart (48-hour)
    const windCtx = document.getElementById('windChart').getContext('2d');
    const windData = data.hourly.wind_speed_10m.slice(0, 48);

    windChart = new Chart(windCtx, {
        type: 'line',
        data: {
            labels: tempTimes,
            datasets: [{
                label: `Wind Speed (${windUnit})`,
                data: windData,
                borderColor: '#cccccc',
                backgroundColor: 'rgba(200, 200, 200, 0.1)',
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
                },
                annotation: {
                    annotations: chartAnnotations
                }
            },
            scales: {
                x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: windUnit, color: '#a0a0a0' }
                }
            }
        }
    });

    // 48-Hour Precipitation Chart
    const precipHourlyCtx = document.getElementById('precipHourlyChart').getContext('2d');
    const precipHourlyData = data.hourly.precipitation.slice(0, 48);

    precipHourlyChart = new Chart(precipHourlyCtx, {
        type: 'line',
        data: {
            labels: tempTimes,
            datasets: [{
                label: 'Precipitation (mm)',
                data: precipHourlyData,
                borderColor: '#6495ED',
                backgroundColor: 'rgba(100, 149, 237, 0.2)',
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
                },
                annotation: {
                    annotations: chartAnnotations
                }
            },
            scales: {
                x: {
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#a0a0a0' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: { display: true, text: 'mm', color: '#a0a0a0' }
                }
            }
        }
    });
    
    // Start animation for "Now" line
    if (currentHourPos >= 0) {
        animateCurrentHourLine();
    }
    
    // Start minute update interval
    if (positionUpdateInterval) clearInterval(positionUpdateInterval);
    positionUpdateInterval = setInterval(() => minuteUpdate(tempTimes), 60000);
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
            <div style="font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem;">${weatherCodeToDescription[weatherCode] || 'Unknown'}</div>
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

// Initialize or update radar map
async function updateRadarMap(lat, lon) {
    const mapContainer = document.getElementById('radarMap');
    if (!mapContainer) return;

    // Initialize map if not exists
    if (!radarMap) {
        radarMap = L.map('radarMap', {
            zoomControl: false,
            attributionControl: false
        }).setView([lat, lon], 7);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(radarMap);
    } else {
        radarMap.setView([lat, lon], 7);
    }

    // Fetch RainViewer radar data
    try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await response.json();
        
        if (data.radar && data.radar.past && data.radar.past.length > 0) {
            const latestRadar = data.radar.past[data.radar.past.length - 1];
            
            if (radarLayer) {
                radarMap.removeLayer(radarLayer);
            }
            
            radarLayer = L.tileLayer(`https://tilecache.rainviewer.com${latestRadar.path}/256/{z}/{x}/{y}/2/1_1.png`, {
                opacity: 0.6
            }).addTo(radarMap);
        }
    } catch (error) {
        console.error('Failed to load radar data:', error);
    }
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

// Load saved or default location on page load
window.addEventListener('load', () => {
    const saved = getSavedLocation();
    if (saved && saved.lat != null && saved.lon != null) {
        fetchWeather(saved.lat, saved.lon, saved.locationName || 'Location', { countryCode: saved.countryCode });
    } else {
        fetchWeather(51.5074, -0.1278, 'London, United Kingdom', { countryCode: 'gb' });
    }
});
