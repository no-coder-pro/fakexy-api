document.addEventListener('DOMContentLoaded', () => {
    const healthLight = document.getElementById('health-light');
    const healthText = document.getElementById('health-text');
    const datasetCount = document.getElementById('dataset-count');
    const countryCount = document.getElementById('country-count');
    const checkApiHealthButton = document.getElementById('check-api-health');
    const countrySelect = document.getElementById('country-select');
    const countrySelectForm = document.getElementById('country-select-form');
    const generatedAddressDiv = document.getElementById('generated-address');
    const countryList = document.getElementById('country-list'); // New element

    let availableCountries = {};

    // Function to update API health status and populate country lists
    async function updateApiHealthStatus() {
        try {
            const response = await fetch('/api/countries');
            if (response.ok) {
                const data = await response.json();
                healthLight.classList.remove('red');
                healthLight.classList.add('green');
                healthText.textContent = 'API Status: Healthy';

                let totalDatasetCount = 0;
                let totalCountryCount = 0;
                for (const countryCode in data) {
                    totalDatasetCount += data[countryCode].count;
                    totalCountryCount++;
                }
                datasetCount.textContent = totalDatasetCount;
                countryCount.textContent = totalCountryCount;
                availableCountries = data;
                populateCountrySelect(data);
                populateCountryList(data); // Populate the new country list
            } else {
                healthLight.classList.remove('green');
                healthLight.classList.add('red');
            healthText.textContent = 'API Status: Unhealthy';
            datasetCount.textContent = 'N/A';
            countryCount.textContent = 'N/A';
            }
        } catch (error) {
            console.error('Error checking API health:', error);
            healthLight.classList.remove('green');
            healthLight.classList.add('red');
            healthText.textContent = 'API Status: Unhealthy';
            datasetCount.textContent = 'N/A';
            countryCount.textContent = 'N/A';
        }
    }

    // Function to populate the country select dropdown
    function populateCountrySelect(countries) {
        countrySelect.innerHTML = '<option value="">Random Address</option>'; // Keep the random option
        const sortedCountries = Object.entries(countries).sort(([, a], [, b]) => a.name.localeCompare(b.name));
        sortedCountries.forEach(([code, info]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${info.name} (${code}) - ${info.count} datasets`;
            countrySelect.appendChild(option);
        });
    }

    // Function to populate the available countries list
    function populateCountryList(countries) {
        countryList.innerHTML = ''; // Clear existing list
        const sortedCountries = Object.entries(countries).sort(([, a], [, b]) => a.name.localeCompare(b.name));
        sortedCountries.forEach(([code, info]) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${info.name} (${code})`;
            countryList.appendChild(listItem);
        });
    }

    // Handle form submission for generating address
    countrySelectForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const selectedCountryCode = countrySelect.value;
        let apiUrl = '';

        if (selectedCountryCode === '') {
            apiUrl = '/api/random';
        } else {
            apiUrl = `/api/address?code=${selectedCountryCode}`;
        }

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            console.log('API Response Data:', data); // Debugging line

            if (response.ok) {
                if (data.suggestion) {
                    generatedAddressDiv.innerHTML = `
                        <p><strong>Suggestion:</strong> ${data.suggestion}</p>
                        <pre>${formatAddress(data.address)}</pre>
                    `;
                } else {
                    generatedAddressDiv.innerHTML = `<pre>${formatAddress(data)}</pre>`;
                }
                console.log('Generated Address Div Content:', generatedAddressDiv.innerHTML); // Debugging line
            } else {
                let errorMessage = data.error || 'An unknown error occurred.';
                if (data.suggestions && data.suggestions.length > 0) {
                    errorMessage += '<br>Suggestions: ' + data.suggestions.map(s => `${s.name} (${s.code})`).join(', ');
                }
                generatedAddressDiv.innerHTML = `<p style="color: red;">Error: ${errorMessage}</p>`;
            }
        } catch (error) {
            console.error('Error generating address:', error);
            generatedAddressDiv.innerHTML = `<p style="color: red;">Error: Could not connect to the API.</p>`;
        }
    });

    // Helper function to format address for display
    // Helper function to format address for display
    function formatAddress(address) {
        if (!address) return 'No address data.';

        const order = [
            'Full Name', 'Gender', 'Birthday', 'Phone Number',
            'Credit card brand', 'Credit card number', 'Expire', 'CVV',
            'Street', 'City/Town', 'State/Province/Region', 'Zip/Postal Code',
            'Country', 'Country_Code', 'Latitude', 'Longitude', 'Social Security Number'
        ];

        let formatted = '';
        const displayedKeys = new Set();

        // Display in specified order
        for (const key of order) {
            if (address[key] !== undefined) {
                formatted += `${key}: ${address[key]}\n`;
                displayedKeys.add(key);
            }
        }
        console.log('Formatted Address:', formatted); // Debugging line

        // Display any remaining keys not in the specified order
        for (const key in address) {
            if (Object.hasOwnProperty.call(address, key) && !displayedKeys.has(key)) {
                formatted += `${key}: ${address[key]}\n`;
            }
        }

        return formatted;
    }

    // Handle API Health Check button click
    checkApiHealthButton.addEventListener('click', async () => {
        const apiEndpoints = [
            '/api/countries',
            '/api/random',
            '/api/address?code=us', // Example country code
            '/api/address?name=bangladesh' // Example country name
        ];

        let allHealthy = true;
        generatedAddressDiv.innerHTML = '<p>Checking all API endpoints...</p>';

        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(endpoint);
                if (!response.ok) {
                    allHealthy = false;
                    generatedAddressDiv.innerHTML += `<p style="color: red;">Endpoint ${endpoint} failed: ${response.status}</p>`;
                } else {
                    generatedAddressDiv.innerHTML += `<p style="color: green;">Endpoint ${endpoint} healthy.</p>`;
                }
            } catch (error) {
                allHealthy = false;
                generatedAddressDiv.innerHTML += `<p style="color: red;">Endpoint ${endpoint} failed: ${error.message}</p>`;
            }
        }

        if (allHealthy) {
            generatedAddressDiv.innerHTML += '<p style="color: green;">All API endpoints are healthy!</p>';
            healthLight.classList.remove('red');
            healthLight.classList.add('green');
            healthText.textContent = 'API Status: Healthy';
        } else {
            generatedAddressDiv.innerHTML += '<p style="color: red;">Some API endpoints are unhealthy.</p>';
            healthLight.classList.remove('green');
            healthLight.classList.add('red');
            healthText.textContent = 'API Status: Unhealthy';
        }
    });

    // Initial API health check on page load
    updateApiHealthStatus();
});
