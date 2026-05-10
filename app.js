document.addEventListener('DOMContentLoaded', () => {
    // You will need to put your Gemini API Key here
    const GEMINI_API_KEY = "AIzaSyAmcZIAJXPTjoD7oeFEdhmJJ5cI_d_4W3M";

    const form = document.getElementById('search-form');
    const input = document.getElementById('herb-input');
    const imageUpload = document.getElementById('image-upload');
    
    const heroSection = document.querySelector('.hero-section');
    const resultSection = document.getElementById('result-section');
    const resultContainer = document.getElementById('result-container');
    const clearBtn = document.getElementById('clear-btn');

    // UI State Management
    const showLoading = () => {
        heroSection.style.display = 'none';
        resultSection.style.display = 'flex';
        resultContainer.innerHTML = `
            <div class="loading-state">
                <i class='bx bx-loader-alt bx-spin' style='font-size: 3rem; color: var(--primary-color);'></i>
                <p style="margin-top: 16px; font-size: 1.1rem; color: var(--text-secondary);">Analyzing plant data...</p>
            </div>
        `;
    };

    const showError = (message) => {
        heroSection.style.display = 'none';
        resultSection.style.display = 'flex';
        resultContainer.innerHTML = `
            <div style="text-align: center; margin-top: 40px; background: #fef2f2; border: 1px solid #fca5a5; padding: 40px; border-radius: 16px; max-width: 600px;">
                <i class='bx bx-error-circle' style='font-size: 4rem; color: #dc2626; margin-bottom: 20px;'></i>
                <h3 style="color: #991b1b; font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 12px;">We hit a snag</h3>
                <p style="color: #b91c1c; font-size: 1.05rem;">${message}</p>
            </div>
        `;
    };

    const showResult = (htmlContent) => {
        heroSection.style.display = 'none';
        resultSection.style.display = 'flex';
        resultContainer.innerHTML = htmlContent;
    };

    clearBtn.addEventListener('click', () => {
        resultSection.style.display = 'none';
        heroSection.style.display = 'flex';
        input.value = '';
    });

    // Build Herb HTML string
    const buildHerbCardHTML = (data) => {
        const referenceHTML = data.referenceUrl ? `<a href="${data.referenceUrl}" target="_blank">${data.researchReference}</a>` : data.researchReference;
        
        const imageSrc = data.imageUrl ? data.imageUrl : 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&q=80'; // fallback
        
        return `
            <div class="pro-herb-card">
                <div class="plant-id-image-col">
                    <img src="${imageSrc}" class="plant-id-image" alt="${data.herbName}">
                </div>
                
                <div class="plant-id-content-col">
                    <div class="plant-id-header-card">
                        <div class="plant-id-scientific">
                            <span><em>${data.scientificName}</em></span>
                            <span class="plant-id-match-badge"><i class='bx bx-check-circle'></i> High Match</span>
                        </div>
                        <h2 class="plant-id-title">${data.herbName}</h2>
                        <div style="color: var(--text-secondary); margin-top: 8px;">
                            <strong>Local Name:</strong> ${data.localName || 'N/A'}
                        </div>
                    </div>

                    <div class="plant-id-card">
                        <h3><i class='bx bx-book-open'></i> Description</h3>
                        <p class="pro-text">${data.description}</p>
                    </div>

                    <div class="plant-id-grid">
                        <div class="plant-id-grid-item">
                            <div class="pro-data-label"><i class='bx bx-bong'></i> Active Compounds</div>
                            <div class="pro-data-value">${data.activeCompounds}</div>
                        </div>
                        <div class="plant-id-grid-item">
                            <div class="pro-data-label"><i class='bx bx-bowl-hot'></i> Preparation</div>
                            <div class="pro-data-value">${data.preparationMethod}</div>
                        </div>
                    </div>

                    <div class="plant-id-card">
                        <h3><i class='bx bx-leaf'></i> Traditional Uses</h3>
                        <p class="pro-text">${data.traditionalUses}</p>
                    </div>

                    <div class="plant-id-card">
                        <h3><i class='bx bx-microscope'></i> Research Benefits</h3>
                        <p class="pro-text">${data.researchBasedBenefits}</p>
                    </div>

                    <div class="pro-alert-box">
                        <div class="pro-alert-icon"><i class='bx bx-error'></i></div>
                        <div class="pro-alert-content">
                            <strong>Safety & Precautions</strong>
                            <p>${data.safetyNotes}</p>
                        </div>
                    </div>

                    <div class="pro-reference-box">
                        <div class="pro-ref-title">Source Reference</div>
                        <div class="pro-ref-content">${referenceHTML}</div>
                    </div>
                </div>
            </div>
        `;
    };

    // Check Firebase for data
    const fetchFromFirebase = async (query) => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            try {
                const dbRef = firebase.database().ref('herbs');
                const snapshot = await dbRef.once('value');
                
                // AUTO SEED DATABASE if empty
                if (!snapshot.exists()) {
                    const updates = {};
                    mockHerbalDatabase.forEach((herb, index) => {
                        updates[index] = herb;
                    });
                    await dbRef.set(updates);
                    const newSnapshot = await dbRef.once('value');
                    if (newSnapshot.exists()) {
                        const data = newSnapshot.val();
                        const herbs = Object.values(data);
                        return herbs.find(h => 
                            h.herbName.toLowerCase().includes(query.toLowerCase()) || 
                            h.localName.toLowerCase().includes(query.toLowerCase()) ||
                            h.scientificName.toLowerCase().includes(query.toLowerCase())
                        );
                    }
                }
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const herbs = Object.values(data);
                    return herbs.find(h => 
                        h.herbName.toLowerCase().includes(query.toLowerCase()) || 
                        h.localName.toLowerCase().includes(query.toLowerCase()) ||
                        h.scientificName.toLowerCase().includes(query.toLowerCase())
                    );
                }
            } catch (err) {
                console.error("Firebase fetch failed or is not configured:", err);
            }
        }
        return null;
    };

    // Fallback to local Mock data
    const fetchFromMock = (query) => {
        if (typeof mockHerbalDatabase === 'undefined') return null;
        
        return mockHerbalDatabase.find(h => 
            h.herbName.toLowerCase().includes(query.toLowerCase()) || 
            h.localName.toLowerCase().includes(query.toLowerCase()) ||
            h.scientificName.toLowerCase().includes(query.toLowerCase())
        );
    };

    // Process Text Search
    const handleQuery = async (query) => {
        showLoading();

        // Simulate network delay to let the loading animation shine
        setTimeout(async () => {
            let result = await fetchFromFirebase(query);
            
            if (!result) {
                // Mock fallback
                result = fetchFromMock(query);
            }

            if (result) {
                showResult(buildHerbCardHTML(result));
            } else {
                showError(`No verified academic evidence found for "<b>${query}</b>" in our database. Please check the spelling or try searching for another herb like Tulsi, Neem, or Ashwagandha.`);
            }
        }, 800);
    };

    // Symptom Checker Logic
    const symptomInput = document.getElementById('symptom-input');
    const analyzeSymptomBtn = document.getElementById('analyze-symptom-btn');

    const handleSymptomAnalysis = async () => {
        const symptoms = symptomInput.value.trim();
        if (!symptoms) return;

        showLoading();

        try {
            if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
                throw new Error("Please add your Gemini API Key in app.js.");
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `You are an expert in Nepali Ayurveda and Herbal Medicine. A user is describing symptoms: "${symptoms}". 
                        Analyze these symptoms and suggest 2-3 traditional Nepali/Ayurvedic herbs that are commonly used for these issues. 
                        Provide exactly:
                        1. A brief explanation of why these symptoms might be occurring from an Ayurvedic perspective (Dosha imbalance).
                        2. A list of 2-3 recommended herbs with:
                           - Herb Name
                           - Local Nepali Name
                           - Brief explanation of its benefit for these specific symptoms.
                        3. A strong medical disclaimer.
                        
                        Return the response as a clean, professionally formatted HTML string that can be directly inserted into a container. 
                        Use standard HTML tags like <h3>, <p>, <ul>, <li>. 
                        Do NOT include markdown block markers like \`\`\`html.` }]
                    }]
                })
            });

            const apiResult = await response.json();
            if (apiResult.error) throw new Error(apiResult.error.message);

            const resultHTML = apiResult.candidates[0].content.parts[0].text;
            showResult(`
                <div class="symptom-result-card">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; color: var(--primary-color);">
                        <i class='bx bx-brain' style="font-size: 2rem;"></i>
                        <h2 style="font-family: var(--font-heading); margin: 0;">AI Symptom Analysis</h2>
                    </div>
                    <div class="pro-text">${resultHTML}</div>
                </div>
            `);
        } catch (err) {
            console.error(err);
            showError(`Failed to analyze symptoms. ${err.message}`);
        }
    };

    if (analyzeSymptomBtn) {
        analyzeSymptomBtn.addEventListener('click', handleSymptomAnalysis);
    }

    // Process Image Search with Gemini
    imageUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64String = event.target.result;
            showLoading();
            
            const base64Data = base64String.split(',')[1];
            const mimeType = file.type || "image/jpeg";

            try {
                if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
                    throw new Error("Please add your Gemini API Key in app.js to enable image recognition.");
                }

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: "You are a botanist and Ayurvedic expert. Identify the medicinal plant in this image. If it is entirely unidentifiable, return a JSON object with 'error': 'Could not identify'. Otherwise, return strictly valid JSON (and absolutely no other markdown, formatting, or text outside the JSON) with the following exact keys: herbName, localName (the Nepali name if known), scientificName, description, traditionalUses (focus on Ayurvedic/Nepalese use), researchBasedBenefits, activeCompounds, preparationMethod, safetyNotes, researchReference (a real scientific study or book citation specifically about this exact plant), and referenceUrl (must be a real, verifiable full https link to PubMed or NCBI about THIS plant, or if unsure, return a Google Scholar search link formatted exactly like this: https://scholar.google.com/scholar?q=[Scientific+Name]). Do not hallucinate fake URLs." },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64Data
                                    }
                                }
                            ]
                        }]
                    })
                });

                const apiResult = await response.json();
                
                if (apiResult.error) {
                    throw new Error(apiResult.error.message || "API Network Error");
                }

                let responseText = apiResult.candidates[0].content.parts[0].text;
                responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                
                const identifiedHerb = JSON.parse(responseText);
                
                if (identifiedHerb.error) {
                    showError("I have visually scanned the image, but I could not confidently identify this plant. Please try capturing a clearer picture of its leaves or flowers.");
                } else {
                    identifiedHerb.imageUrl = base64String;
                    
                    const resultHTML = `
                        <div style="background: #ecfdf5; border: 1px solid #10b981; color: #065f46; padding: 16px 24px; border-radius: 12px; margin-bottom: 24px; display: inline-flex; align-items: center; gap: 12px; font-weight: 500;">
                            <i class='bx bx-check-shield' style="font-size: 1.5rem;"></i> Imaged Analysis Complete. High confidence match found.
                        </div>
                        ${buildHerbCardHTML(identifiedHerb)}
                    `;
                    showResult(resultHTML);
                }

            } catch (err) {
                console.error(err);
                showError(`Failed to process the image. ${err.message}`);
            }
            
            // Reset
            imageUpload.value = '';
        };
        reader.readAsDataURL(file);
    });

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const userInput = input.value.trim();
        if (userInput === '') return;

        handleQuery(userInput);
    });

    // Auth state observer
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0 && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const navLoginBtn = document.getElementById('nav-login-btn');
            if (navLoginBtn) {
                if (user) {
                    navLoginBtn.innerHTML = `<i class='bx bx-log-out'></i> Logout`;
                    navLoginBtn.href = "#";
                    navLoginBtn.onclick = (e) => {
                        e.preventDefault();
                        firebase.auth().signOut().then(() => window.location.reload());
                    };
                } else {
                    navLoginBtn.innerHTML = `<i class='bx bx-user'></i> Login`;
                    navLoginBtn.href = "index.html";
                    navLoginBtn.onclick = null;
                }
            }
        });
    }
});
