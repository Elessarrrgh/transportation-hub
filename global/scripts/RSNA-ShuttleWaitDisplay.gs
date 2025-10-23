/**
 * Serves the HTML content to be displayed on the Squarespace website.
 * This function retrieves data for a single specified shuttle route (in this case, Route 6)
 * for both SOUTH and LAKE destinations using a hard-coded route number.
 */

function doGet() {
  // Use the correct spreadsheet ID.
  const ss = SpreadsheetApp.openById("1TLRTwwevKO3KTK_wsJzYhNeI5HIDQoLVj2cIVsyVbeg");
  const sheet = ss.getSheetByName("Display Tab");

  // This is the hard-coded route number. This should be changed for each new deployment.
  const routeNumber = "6";

  // A mapping of route numbers to their corresponding starting row number.
  const routeMappings = {
    "1": { row: 5 },
    "2": { row: 10 },
    "3": { row: 15 },
    "4": { row: 20 },
    "5": { row: 25 },
    "6": { row: 30 }
  };

  // Use the route mapping to get the correct row number.
  const row = routeMappings[routeNumber].row;
  
  // --- Retrieves data for both SOUTH and LAKE destinations for the given route ---
  // The data for SOUTH is in column C and LAKE is in column F.
  const southServiceStatus = sheet.getRange(`C${row}`).getValue();
  const southWaitTime = sheet.getRange(`C${row + 1}`).getValue();
  const southLastUpdate = sheet.getRange(`C${row + 2}`).getDisplayValue();

  const lakeServiceStatus = sheet.getRange(`F${row}`).getValue();
  const lakeWaitTime = sheet.getRange(`F${row + 1}`).getValue();
  const lakeLastUpdate = sheet.getRange(`F${row + 2}`).getDisplayValue();

  // --- Generates the combined HTML output with dynamic CSS and data ---
  const htmlOutput = `
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 18px;
        margin: 0;
        padding: 1em;
        text-align: left;
        background: transparent;
      }
      .services-card {
        border-radius: 8px;
        padding: 1em;
        background-color: rgba(255, 255, 255, 0.8);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .services-card h3 {
        text-align: center;
        margin-top: 0;
        margin-bottom: 1em;
        font-weight: bold;
      }
      .destinations-container {
        display: flex;
        justify-content: space-around;
        gap: 20px;
      }
      .destination-block {
        flex: 1;
      }
      .south-header {
        color: darkred;
        text-align: center;
      }
      .lake-header {
        color: darkblue;
        text-align: center;
      }
      .label {
        font-weight: bold;
        color: #555;
      }
      .data {
        margin-bottom: 1em;
      }
      @media (max-width: 768px) {
        .destinations-container {
          flex-direction: column;
        }
      }
    </style>

    <div class="services-card">
      <h3>Route ${routeNumber} Shuttles</h3>
      <div class="destinations-container">
        <!-- SOUTH destination block -->
        <div class="destination-block">
          <h4 class="south-header">Shuttles to South Hall</h4>
          <div class="status-line">
            <div class="label">Service Status:</div>
            <div class="data">${southServiceStatus}</div>
          </div>
          <div class="status-line">
            <div class="label">Approximate Wait:</div>
            <div class="data">${southWaitTime}</div>
          </div>
          <div class="status-line">
            <div class="label">Last Updated:</div>
            <div class="data">${southLastUpdate}</div>
          </div>
        </div>

        <!-- LAKE destination block -->
        <div class="destination-block">
          <h4 class="lake-header">Shuttles to Lakeside Center</h4>
          <div class="status-line">
            <div class="label">Service Status:</div>
            <div class="data">${lakeServiceStatus}</div>
          </div>
          <div class="status-line">
            <div class="label">Approximate Wait:</div>
            <div class="data">${lakeWaitTime}</div>
          </div>
          <div class="status-line">
            <div class="label">Last Updated:</div>
            <div class="data">${lakeLastUpdate}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  return HtmlService.createHtmlOutput(htmlOutput).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}