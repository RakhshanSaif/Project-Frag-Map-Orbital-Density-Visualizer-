// WAIT FOR PAGE TO LOAD
window.onload = function () {

    if (!DB.isLoggedIn()) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("navUser").innerText =
        "👤 " + DB.getCurrentUser();

    loadTLEData().then(() => {
        startAutoUpdate();
        console.log("✅ Data ready:", satellites.length, "objects");
    });

    // SLIDER SETUP
    const slider = document.getElementById("slider");
    const sliderValue = document.getElementById("sliderValue");

    slider.oninput = function () {
        sliderValue.innerText = "Altitude: " + this.value + " km";
    };

    // ANALYZE BUTTON
    document.getElementById("analyzeBtn").onclick = function () {

        if (satellites.length === 0) {
            alert("No data loaded yet. Please wait.");
            return;
        }

        let zones = { LOW: 0, MEDIUM: 0, HIGH: 0 };
        let listHTML = "";
        const now = new Date();
        const maxAlt = parseInt(slider.value);

        satellites.forEach(sat => {
            try {
                const satrec = satellite.twoline2satrec(sat.l1, sat.l2);
                const pos = satellite.propagate(satrec, now);

                if (!pos.position) return;

                const gmst = satellite.gstime(now);
                const geo = satellite.eciToGeodetic(pos.position, gmst);
                const alt = geo.height;

                if (alt > 0 && alt < maxAlt) {
                    let zone;
                    let color;

                    if (alt < 300) {
                        zone = "LOW";
                        color = "lime";
                    } else if (alt < 600) {
                        zone = "MEDIUM";
                        color = "yellow";
                    } else {
                        zone = "HIGH";
                        color = "red";
                    }

                    zones[zone]++;
                    listHTML += sat.name + " → " +
                        alt.toFixed(2) + " km → " +
                        "<span style='color:" + color + "'>" +
                        zone + "</span><br>";
                }

            } catch (e) {
                // skip bad TLE
            }
        });

        if (listHTML === "") {
            listHTML = "<p style='color:yellow'>No objects found at this altitude range. Try moving slider to the right.</p>";
        }

        document.getElementById("satelliteList").innerHTML =
            "<h3>🛰 Satellite / Debris Data</h3>" + listHTML;

        document.getElementById("summary").innerHTML =
            "<h3>📊 Risk Summary</h3><br>" +
            "🟢 LOW: " + zones.LOW +
            "<div style='background:lime; height:10px; width:" +
            Math.min(zones.LOW * 5, 300) + "px; margin:5px 0;'></div>" +
            "🟡 MEDIUM: " + zones.MEDIUM +
            "<div style='background:yellow; height:10px; width:" +
            Math.min(zones.MEDIUM * 5, 300) + "px; margin:5px 0;'></div>" +
            "🔴 HIGH: " + zones.HIGH +
            "<div style='background:red; height:10px; width:" +
            Math.min(zones.HIGH * 5, 300) + "px; margin:5px 0;'></div>" +
            "<br><p style='color:yellow'>Total objects analyzed: " +
            (zones.LOW + zones.MEDIUM + zones.HIGH) + "</p>" +
            "<p style='color:yellow'>Last Analyzed: " +
            new Date().toLocaleTimeString() + "</p>";

        lastZones = zones;
        DB.saveReport(zones);
    };

    // HEALTH REPORT BUTTON
    document.getElementById("reportBtn").onclick = function () {
        let msg = "🚀 ORBITAL HEALTH REPORT\n";
        msg += "========================\n\n";
        msg += "🟢 LOW Risk:    " + lastZones.LOW + " objects\n";
        msg += "🟡 MEDIUM Risk: " + lastZones.MEDIUM + " objects\n";
        msg += "🔴 HIGH Risk:   " + lastZones.HIGH + " objects\n\n";

        if (lastZones.HIGH > 5) {
            msg += "⚠️ CRITICAL: High congestion detected!\n";
            msg += "Kessler Syndrome risk is elevated.\n";
        } else if (lastZones.MEDIUM > 5) {
            msg += "⚠️ WARNING: Moderate congestion observed.\n";
        } else {
            msg += "✅ STATUS: Orbital environment stable.\n";
        }

        msg += "\nGenerated: " + new Date().toLocaleString();
        msg += "\nUser: " + DB.getCurrentUser();
        alert(msg);
    };
};

// MANUAL FETCH BUTTON
async function manualFetch() {
    document.getElementById("fetchBtn").innerText = "⏳ Fetching...";
    document.getElementById("fetchBtn").disabled = true;
    await loadTLEData();
    document.getElementById("fetchBtn").innerText = "🌐 Fetch Live Data";
    document.getElementById("fetchBtn").disabled = false;
}

// DOWNLOAD REPORT
function downloadReport() {
    const reports = DB.getReports();
    const text = JSON.stringify(reports, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fragmap_report.json";
    a.click();
}

// SEARCH
function searchSatellite() {
    const query = document.getElementById("searchBar").value.toLowerCase();
    const results = satellites.filter(sat =>
        sat.name.toLowerCase().includes(query)
    );

    let html = "<h3>🔍 Search Results</h3>";
    if (results.length === 0) {
        html += "<p style='color:red'>No results found</p>";
    } else {
        results.slice(0, 50).forEach(sat => {
            html += sat.name + "<br>";
        });
        html += "<br><p style='color:yellow'>Showing " +
            Math.min(results.length, 50) + " of " +
            results.length + " results</p>";
    }
    document.getElementById("satelliteList").innerHTML = html;
}

let lastZones = { LOW: 0, MEDIUM: 0, HIGH: 0 };
