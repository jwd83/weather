# AGENTS.md

This file documents the AI agents involved in building and maintaining this project.

## Code Generation

The weather application was developed using:

- **GPT 5.2** - Primary code generation
- **GLM 4.7** - Additional code generation
- **Claude Opus 4.5** - Feature additions, refinements, and maintenance mode prep

## Documentation

- **Claude Opus** - Generated and maintains README.md and AGENTS.md

## Project Structure

```
weather/
├── index.html    # Main HTML structure
├── script.js     # Application logic, API calls, Chart.js & Leaflet integration
├── styles.css    # Responsive styling with CSS variables for theming
├── favicon.png   # App icon
├── start.bat     # Windows launch script
├── start.sh      # Unix launch script
├── CNAME         # Custom domain config
├── README.md     # Project documentation
└── AGENTS.md     # This file
```

## Key Implementation Details

- Uses Open-Meteo API (free, no API key required)
- Nominatim for geocoding city names to coordinates
- RainViewer for radar imagery overlay
- OpenStreetMap / Leaflet for interactive map tiles
- WMO weather codes mapped to emojis and descriptions
- LocalStorage for persisting temperature unit and theme preferences
- Chart.js for data visualization (temperature, wind, humidity, precipitation, shower chance)
- Dark/Light theme toggle
- 10-day forecast with detailed current conditions table

## Status

This project is now in **maintenance mode**.
