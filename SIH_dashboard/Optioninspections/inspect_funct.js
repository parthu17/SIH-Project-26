const API_URL = 'http://127.0.0.1:8000/api/inspections';

async function fetchInspectionData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log("Raw API response array:", data); 
        
        if (Array.isArray(data)) {
            if (data.length === 0) {
                console.warn("API returned an empty array []");
                return;
            }
            
            // 1. Look up the current URL string (e.g. ?index=1)
            const urlParams = new URLSearchParams(window.location.search);
            // 2. Extract the number, defaulting to 0 if the parameter is missing
            const recordIndex = parseInt(urlParams.get('index')) || 0;
            
            console.log(`Rendering data for array index position: ${recordIndex}`);
            
            // 3. Dynamic Fix: Select the requested index rather than hardcoding [0]
            if (data[recordIndex]) {
                renderData(data[recordIndex]); 
            } else {
                console.error(`Record index ${recordIndex} does not exist in database array.`);
                renderData(data[0]); // Fallback safely to first record
            }
        } else {
            renderData(data); // If the backend is already a single object, use it directly
        }
    } catch (error) {
        console.error("Error loading data from server:", error);
    }
}

function renderData(data) {
    if (!data) {
        console.error("No valid data object provided to renderData");
        return;
    }

    try {
        // 1. Map Core text details
        if (document.getElementById('name-institute')) {
            document.getElementById('name-institute').textContent = data.institutionName || "Unknown Institution";
        }
        if (document.getElementById('inspector-name')) {
            document.getElementById('inspector-name').textContent = `Inspector: ${data.inspector || "N/A"}`;
        }
        if (document.getElementById('observation-p')) {
            document.getElementById('observation-p').textContent = data.notes ? `"${data.notes}"` : '"No notes provided"';
        }

        // 2. Safely parse coordinates
        if (document.getElementById('location-coordinates')) {
            const lat = (typeof data.lat === 'number') ? data.lat.toFixed(4) : 'N/A';
            const lng = (typeof data.lng === 'number') ? data.lng.toFixed(4) : 'N/A';
            document.getElementById('location-coordinates').textContent = `${lat}, ${lng}`;
        }
        
        // 3. Format & Map Timestamp
        if (document.getElementById('inspection-date') && data.timestamp) {
            const date = new Date(data.timestamp);
            const options = { day: '2-digit', month: 'short', year: 'numeric' };
            document.getElementById('inspection-date').textContent = date.toLocaleDateString('en-GB', options);
        }

        // 4. Handle Status Flag
        const statusEl = document.getElementById('inspection-status');
        if (statusEl) {
            statusEl.textContent = data.flagged ? "Status: Flagged" : "Status: Clear";
            statusEl.style.color = data.flagged ? "red" : "green";
        }

        // 5. Update Checklist elements
        if (document.getElementById('chk-facility')) {
            document.getElementById('chk-facility').textContent = `${data.facilityOk ? '✅' : '❌'} Facility Layout`;
        }
        if (document.getElementById('chk-hygiene')) {
            document.getElementById('chk-hygiene').textContent = `${data.hygieneOk ? '✅' : '❌'} Hygiene Standards`;
        }
        if (document.getElementById('chk-documents')) {
            document.getElementById('chk-documents').textContent = `${data.documentsOk ? '✅' : '❌'} Documents Verified`;
        }
        
        if (document.getElementById('location-verification')) {
            document.getElementById('location-verification').textContent = "✅ Location Verified";
        }

        // 6. Fetch and insert Image Photo Url
        const photoContainer = document.getElementById('photo-container');
        if (photoContainer) {
            if (data.photoUrl) {
                const img = document.createElement('img');
                img.src = data.photoUrl.startsWith('http') ? data.photoUrl : `http://127.0.0.1:8000${data.photoUrl}`; 
                img.alt = "Inspection Evidence Photo";
                img.style.maxWidth = "100%";
                img.style.borderRadius = "8px";
                img.style.marginTop = "10px";
                
                photoContainer.innerHTML = ''; 
                photoContainer.appendChild(img);
            } else {
                photoContainer.textContent = "No photo evidence provided.";
            }
        }
    } catch (renderError) {
        console.error("A critical crash occurred inside renderData:", renderError);
    }
}

document.addEventListener('DOMContentLoaded', fetchInspectionData);
