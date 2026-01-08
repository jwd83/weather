# Weather

A modern, responsive weather application that displays current conditions and 10-day forecasts using the Open-Meteo API.

## Features

- **Current Weather**: Temperature, humidity, wind speed, pressure, feels-like temperature, and precipitation
- **10-Day Forecast**: Daily high/low temperatures, weather conditions, and precipitation probability
- **Interactive Radar Map**: Live precipitation overlay via RainViewer on a Leaflet/OpenStreetMap map
- **Interactive Charts**: 48-hour temperature, wind speed, humidity, precipitation, and shower chance trends (Chart.js)
- **Dual Input Modes**: Search by city name or enter coordinates directly
- **Unit Toggle**: Switch between Celsius/Fahrenheit with persistent preference
- **Theme Toggle**: Dark and light mode with persistent preference
- **Auto Unit Detection**: Defaults to Fahrenheit for US locations, Celsius elsewhere
- **Responsive Design**: Works on desktop, tablet, and mobile

## APIs & Data Providers

- [Open-Meteo](https://open-meteo.com/) - Weather data (free, no API key required)
- [Nominatim (OpenStreetMap)](https://nominatim.openstreetmap.org/) - Geocoding and reverse geocoding
- [RainViewer](https://www.rainviewer.com/) - Radar/precipitation imagery
- [OpenStreetMap](https://www.openstreetmap.org/) - Map tiles via Leaflet

## Usage

Open `index.html` in a browser, or use the provided launch scripts:
- Windows: `start.bat`
- Unix/Mac: `./start.sh`

No build step required.

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- [Chart.js](https://www.chartjs.org/) (CDN) with annotation and datalabels plugins
- [Leaflet](https://leafletjs.com/) (CDN) for interactive maps

## Development Credits

- **Application code**: Built with GPT 5.2, GLM 4.7, and Claude Opus 4.5
- **Documentation**: Generated and maintained by Claude Opus


## Source

[GitHub Repository](https://github.com/jwd83/weather)
