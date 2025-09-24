# Fake Address Generator

## Overview
This is a Flask-based web application that generates fake addresses for various countries. The application provides both a web interface and a REST API for generating fake address data.

## Recent Changes
- 2025-09-24: Imported from GitHub and configured for Replit environment
- Configured Flask to run on 0.0.0.0:5000 for proper Replit hosting
- Set up workflow for Flask development server
- Configured deployment settings for production (autoscale)

## Project Architecture
- **Backend**: Flask Python web application
- **Frontend**: HTML/CSS/JavaScript with Bootstrap-style components
- **Data**: JSON files containing fake address data for 95+ countries
- **APIs**: RESTful endpoints for address generation and country data

### Key Components
- `app.py`: Main Flask application with API endpoints
- `templates/index.html`: Frontend web interface
- `static/`: CSS and JavaScript for frontend
- `data/`: JSON files with country-specific fake address data
- `requirements.txt`: Python dependencies

### API Endpoints
- `GET /`: Main web interface
- `GET /api/countries`: List available countries and data counts
- `GET /api/random`: Get random address from any country
- `GET /api/address?code=XX`: Get address by country code
- `GET /api/address?name=CountryName`: Get address by country name

## User Preferences
- Python-based Flask application
- Uses fuzzy matching for country name suggestions
- Serves both web interface and API endpoints
- Data stored in JSON files for easy access

## Development Setup
- Python 3.11 with Flask 2.3.2
- Dependencies: fuzzywuzzy, python-Levenshtein
- Development server runs on port 5000
- Production deployment configured for autoscale