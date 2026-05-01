// --- PASTE YOUR GOOGLE AI STUDIO API KEY HERE ---
const API_KEY = "AIzaSyBg-u7YZrnp2g3OOk2FB5lqxXmvs1jMNlk"; 
// ------------------------------------------------

// Check if you are already parked when you open the app
window.onload = function() {
    if (localStorage.getItem("parkedData")) {
        showDepartureView();
    }
};

async function saveParking() {
    const building = document.getElementById('building-name').value;
    const fileInput = document.getElementById('camera-input');

    if (!building || fileInput.files.length === 0) {
        alert("Please enter a building name and take a photo of the pillar.");
        return;
    }

    document.getElementById('loading').style.display = "block";

    // Convert the image to base64 so the AI can read it
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onloadend = async function() {
        const base64Image = reader.result.split(',')[1]; 

        const promptText = `You are a parking navigation assistant. The user is parked at ${building}. Attached is a photo of their parking pillar/lot. 1. Extract the lot number, level, and any color-coding. 2. Using your knowledge of this building, provide concise, step-by-step directions on how to return to this exact spot from the main ground floor.`;

        try {
            // Call the Gemini API
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: promptText },
                            { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                        ]
                    }]
                })
            });

            const data = await response.json();
            const aiDirections = data.candidates[0].content.parts[0].text;

            // Save everything to LocalStorage
            const parkingRecord = {
                building: building,
                timeIn: new Date().toISOString(),
                directions: aiDirections
            };
            localStorage.setItem("parkedData", JSON.stringify(parkingRecord));

            document.getElementById('loading').style.display = "none";
            showDepartureView();

        } catch (error) {
            alert("Error connecting to AI. Check your API key or internet.");
            document.getElementById('loading').style.display = "none";
        }
    };
    reader.readAsDataURL(file);
}

async function retrieveCar() {
    const record = JSON.parse(localStorage.getItem("parkedData"));
    const timeOut = new Date().toISOString();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    document.getElementById('directions-text').innerHTML = "Calculating cost...";

    const costPrompt = `You are a Singapore parking rate calculator. The user parked a car at ${record.building}. Date: ${dayOfWeek}. Time In: ${record.timeIn}. Time Out: ${timeOut}. Calculate the estimated parking fee in SGD based on standard rates. Return ONLY the final estimated cost formatted exactly as '$X.XX'. Do not explain your math.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: costPrompt }] }]
            })
        });

        const data = await response.json();
        const costEstimate = data.candidates[0].content.parts[0].text;

        // Show cost, clear storage, reset app
        alert(`Your estimated parking fee is: ${costEstimate}`);
        localStorage.removeItem("parkedData");
        location.reload(); // Refresh the app to the arrival screen

    } catch (error) {
        alert("Found your car! But couldn't calculate cost. Resetting app.");
        localStorage.removeItem("parkedData");
        location.reload();
    }
}

function showDepartureView() {
    document.getElementById('arrival-view').style.display = "none";
    document.getElementById('departure-view').style.display = "block";
    
    const record = JSON.parse(localStorage.getItem("parkedData"));
    // Format the AI text so line breaks show up nicely in HTML
    document.getElementById('directions-text').innerHTML = record.directions.replace(/\n/g, '<br>');
}
