const API_KEY =
  "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";
  const exchangeRates = {
    USD: 1,
    INR: 83,
    EUR: 0.93,
    GBP: 0.80,
    JPY: 155.25,
  };
  
  let selectedCurrency = "USD"; 
  let storedItinerary = []; 
  
  if (window.location.pathname.includes('generate.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const destination = urlParams.get('destination');
    const startDate = urlParams.get('startDate');
    const endDate = urlParams.get('endDate');
  
    async function fetchItinerary() {
      const loadingDiv = document.getElementById('loading');
      const resultsDiv = document.getElementById('results');
      const itineraryBody = document.getElementById('itineraryBody');
  
      loadingDiv.classList.remove('hidden');
      resultsDiv.classList.add('hidden');
  
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-r1-zero:free",
            messages: [
              {
                role: "user",
                content: `Create a brief travel itinerary for ${destination} from ${startDate} to ${endDate}.
                Requirements:
                - Maximum 3 activities per day
                - Each activity description should be 3-4 words maximum
                - Add a short (1-2 sentence) description for visiting that place
                - Approximate budget for each activity (in USD)
                - Suggest a royalty-free image URL for each place
                - Format each activity exactly like:
                  Day number | Time | Activity Name | Budget | Description | Image URL
                Example format:
                Day 1 | 9 AM | Visit Central Park | 0 | Stroll through scenic park trails | https://example.com/centralpark.jpg
                Day 1 | 2 PM | Shopping at Mall | 50 | Explore local stores and souvenirs | https://example.com/mall.jpg`
              }
            ]
          }),
        });
  
        const data = await response.json();
        loadingDiv.classList.add('hidden');
  
        const content = data.choices?.[0]?.message?.content || "";
  
        storedItinerary = [];
  
        const lines = content.split("\n").filter(line => line.includes("|"));
  
        for (const line of lines) {
          const parts = line.split("|").map(p => p.trim());
          if (parts.length >= 5) { // accept minimum 5 parts even if no image
            const day = parts[0] || "";
            const time = parts[1] || "";
            const activity = parts[2] || "";
            const budget = parseFloat(parts[3]) || 0; 
            const description = parts[4] || "";
            const imageUrl = parts[5] || "";
        
            storedItinerary.push({
              day,
              time,
              activity,
              budget,
              description,
              imageUrl
            });
          }
        }
        
  
        if (storedItinerary.length === 0) {
          alert("Could not generate a proper itinerary. Please try again later!");
          return;
        }
  
        await renderItinerary();
  
      } catch (error) {
        console.error('Error:', error);
        loadingDiv.classList.add('hidden');
        alert('An error occurred while generating your itinerary. Please try again.');
      }
    }
  
    async function getWikipediaLink(activity) {
      try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&search=${encodeURIComponent(activity)}`;
        const wikiResponse = await fetch(searchUrl);
        const wikiData = await wikiResponse.json();
        if (wikiData[3] && wikiData[3][0]) {
          return wikiData[3][0];
        } else {
          return null;
        }
      } catch (error) {
        console.error('Wikipedia fetch error:', error);
        return null;
      }
    }
  
    async function renderItinerary() {
      const itineraryBody = document.getElementById('itineraryBody');
      itineraryBody.innerHTML = "";
  
      const rate = exchangeRates[selectedCurrency] || 1;
      let symbol = "$";
      if (selectedCurrency === "INR") symbol = "₹";
      if (selectedCurrency === "EUR") symbol = "€";
      if (selectedCurrency === "GBP") symbol = "£";
      if (selectedCurrency === "JPY") symbol = "¥";
  
      for (const item of storedItinerary) {
        const wikiLink = await getWikipediaLink(item.activity);
  
        const convertedBudget = (item.budget * rate).toFixed(2);
  
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${item.day}</td>
          <td>${item.time}</td>
          <td>${item.activity}</td>
          <td>${symbol}${convertedBudget}</td>
          <td>${item.description}</td>
          <td>
            ${wikiLink ? `<a href="${wikiLink}" target="_blank" style="color:blue;text-decoration:underline;">Wikipedia</a>` : 'No Link'}
          </td>
        `;
        itineraryBody.appendChild(row);
      }
  
      document.getElementById('results').classList.remove('hidden');
    }
  
    function goBack() {
      window.location.href = "index.html";
    }
  
    // Currency Dropdown
    const budgetHeader = document.getElementById("budgetHeader");
    const currencyDropdown = document.getElementById("currencyDropdown");
  
    budgetHeader.addEventListener("click", (e) => {
      e.stopPropagation();
      currencyDropdown.style.display = currencyDropdown.style.display === "block" ? "none" : "block";
    });
  
    document.querySelectorAll(".currency-option").forEach(option => {
      option.addEventListener("click", (e) => {
        selectedCurrency = e.target.getAttribute("data-currency");
        renderItinerary();
        currencyDropdown.style.display = "none";
      });
    });
  
    document.addEventListener("click", () => {
      currencyDropdown.style.display = "none";
    });
  
    fetchItinerary(); 
  }
  
  
  