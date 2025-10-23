document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("hotelSearch");
    const hotelListContainer = document.getElementById("hotelList");

    // Parse URL path: /{showAcronym}/{year}/hotels/... or /{showAcronym}/{year}/shuttles
    const pathParts = window.location.pathname.split("/").filter(Boolean);

    if (pathParts.length < 3) {
        hotelListContainer.innerHTML = "<p>Unable to detect show, year, and hotels folder from URL.</p>";
        return;
    }

    const showAcronym = pathParts[0];
    const showYear = pathParts[1];
    const feedUrl = `https://www.rhodeplanning.com/${showAcronym}/${showYear}/hotels?format=json`;

    fetch(feedUrl)
        .then(response => response.json())
        .then(data => {
            const hotels = data.items.map(item => ({
                name: item.title.trim(),
                meta: item.excerpt?.trim() || "",
                url: item.fullUrl,
                imageUrl: item.assetUrl || ""
            }));

            // --- ADD THIS BLOCK ---
			function normalizeTitle(title) {
    			return title.replace(/^(the |a |an )/i, "").trim();
			}
      
      		// Sort hotels alphabetically by name
            hotels.sort((a, b) => normalizeTitle(a.name).localeCompare(normalizeTitle(b.name)));

            hotels.forEach(hotel => {
                const div = document.createElement("div");
                div.className = "hotel-item";
                div.innerHTML = `
                    <a href="${hotel.url}" class="hotel-link">
                        ${hotel.imageUrl ? `<img src="${hotel.imageUrl}" alt="${hotel.name} photo" class="hotel-thumb" loading="lazy" />` : ''}
                        <div class="hotel-info">
                            <span class="hotel-name">${hotel.name}</span>
                            <span class="hotel-meta">${hotel.meta}</span>
                        </div>
                    </a>
                `;
                hotelListContainer.appendChild(div);
            });

            const fuse = new Fuse(hotels, {
                keys: ["name", "meta"],
                threshold: 0.3
            });

            searchInput.addEventListener("input", function() {
                const query = searchInput.value.trim();
                if (!query) {
                    Array.from(hotelListContainer.children).forEach(el => el.style.display = "");
                    return;
                }
                const results = fuse.search(query).map(r => r.item.name);
                Array.from(hotelListContainer.children).forEach(el => {
                    const name = el.querySelector("a").innerText.trim();
                    el.style.display = results.includes(name) ? "" : "none";
                });
            });
        })
        .catch(err => {
            console.error("Error loading hotels:", err);
            hotelListContainer.innerHnoTML = "<p>Unable to load hotels at this time.</p>";
        });
});