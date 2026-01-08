# AGENTS.md

This file documents the AI agents involved in building and maintaining this project.

## Code Generation

The weather application was developed using:

- **GPT 5.2** - Primary code generation
- **GLM 4.7** - Additional code generation

## Documentation

- **Claude Opus** - Generated README.md and AGENTS.md

## Project Structure

```
weather/
├── index.html    # Main HTML structure
├── script.js     # Application logic, API calls, Chart.js integration
├── styles.css    # Responsive styling with CSS gradients
├── README.md     # Project documentation
└── AGENTS.md     # This file
```

## Key Implementation Details

- Uses Open-Meteo API (free, no API key required)
- Nominatim for geocoding city names to coordinates
- WMO weather codes mapped to emojis and descriptions
- LocalStorage for persisting temperature unit preference
- Chart.js for data visualization
