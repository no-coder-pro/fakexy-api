import os
import json
import random
from flask import Flask, jsonify, render_template, request, send_from_directory
from fuzzywuzzy import process

app = Flask(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
fake_addresses_data = {}
country_names = {}

def load_fake_addresses_data():
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            country_code = filename.split('.')[0].lower()
            filepath = os.path.join(DATA_DIR, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                fake_addresses_data[country_code] = data
                if data:
                    # Assuming the first item in the data has a 'Country' field (uppercase C)
                    country_name = data[0].get('Country', country_code).lower()
                    country_names[country_code] = country_name
    print(f"Loaded {len(country_names)} countries successfully") # Production-safe logging

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/countries')
def get_countries():
    countries_info = {}
    for country_code, data in fake_addresses_data.items():
        countries_info[country_code.upper()] = {
            'name': country_names.get(country_code, country_code).title(),
            'count': len(data)
        }
    return jsonify(countries_info)

@app.route('/api/random')
def get_random_address():
    all_addresses = []
    for country_code in fake_addresses_data:
        all_addresses.extend(fake_addresses_data[country_code])
    if all_addresses:
        chosen_address = random.choice(all_addresses)
        # Removed PII logging for security
        return jsonify(chosen_address)
    return jsonify({"error": "No address data available"}), 404


@app.route('/api/address')
def get_address_by_query_param():
    code = request.args.get('code')
    name = request.args.get('name')

    if code:
        return get_address_and_suggestions(code)
    elif name:
        return get_address_and_suggestions(name)
    else:
        return jsonify({"error": "Please provide 'code' or 'name' query parameter."}), 400

def get_address_and_suggestions(identifier):
    identifier_lower = identifier.lower()
    # Processing country lookup request

    # 1. Try exact match by country code
    if identifier_lower in fake_addresses_data:
        addresses = fake_addresses_data[identifier_lower]
        if addresses:
            chosen_address = random.choice(addresses)
            # Found exact country code match
            return jsonify(chosen_address)

    # 2. Try exact match by country name (direct lookup)
    name_to_code_map = {name: code for code, name in country_names.items()}
    # Mapping country names to codes
    if identifier_lower in name_to_code_map:
        code = name_to_code_map[identifier_lower]
        addresses = fake_addresses_data[code]
        if addresses:
            chosen_address = random.choice(addresses)
            # Found exact country name match
            return jsonify(chosen_address)

    # 3. Fuzzy matching
    best_match_code = None
    best_match_score = 0

    # Fuzzy match against country codes
    code_matches = process.extractOne(identifier_lower, fake_addresses_data.keys())
    if code_matches and code_matches[1] > best_match_score:
        best_match_code = code_matches[0]
        best_match_score = code_matches[1]

    # Fuzzy match against country names
    name_matches = process.extractOne(identifier_lower, country_names.values())
    if name_matches and name_matches[1] > best_match_score:
        best_match_code = name_to_code_map[name_matches[0]]
        best_match_score = name_matches[1]

    if best_match_code and best_match_score >= 70: # Threshold for a good match
        addresses = fake_addresses_data[best_match_code]
        if addresses:
            chosen_address = random.choice(addresses)
            # Found fuzzy match for country
            return jsonify({
                "suggestion": f"Did you mean {country_names[best_match_code].title()} ({best_match_code.upper()})?",
                "address": chosen_address
            })
        return jsonify({"error": f"No address data for {identifier}"}), 404

    # 4. Generate suggestions if no good match was found
    suggestions = []
    if identifier_lower and identifier_lower.isalpha():
        # Attempt 1: Suggest based on the full identifier as a prefix
        for code, name in country_names.items():
            if code.startswith(identifier_lower):
                suggestions.append({"code": code.upper(), "name": name.title()})

        # Attempt 2: If no suggestions from Attempt 1, and identifier is multi-character,
        # suggest based on the first letter of the identifier.
        if not suggestions and len(identifier_lower) > 1:
            first_letter = identifier_lower[0]
            for code, name in country_names.items():
                if code.startswith(first_letter):
                    suggestions.append({"code": code.upper(), "name": name.title()})

    # Fallback: If no specific suggestions were found, or if input was not alphabetic,
    # provide all countries as suggestions.
    if not suggestions:
        suggestions = [
            {"code": code.upper(), "name": name.title()}
            for code, name in country_names.items()
        ]

    return jsonify({
        "error": f"Country '{identifier}' not found.",
        "suggestions": suggestions
    }), 404


@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    load_fake_addresses_data()
    app.run(host='0.0.0.0', port=5000, debug=False)

@app.route('/data/<path:filename>')
def data_files(filename):
    return send_from_directory('data', filename)

# Load data at module level for serverless deployment
load_fake_addresses_data()
