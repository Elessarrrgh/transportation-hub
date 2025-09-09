function doGet(e) {
  // Spreadsheet and sheet reference
  const ss = SpreadsheetApp.openById("1Vs8eMK_t88TaZGYx6wsQgRmdCr-fzFxMyn6xnWJjUwE");
  const sheet = ss.getSheetByName("Display Tab");

  // Get the route number from the URL parameters
  const routeNumber = e.parameter.route;

  // Map each route number to the row where its data starts
  const routeMappings = {
    "1": { row: 5 },
    "2": { row: 10 },
    "3": { row: 15 },
    "4": { row: 20 },
    "5": { row: 25 },
    "6": { row: 30 }
  };

  if (!routeMappings[routeNumber]) {
    return HtmlService.createHtmlOutput(`<p style="color:red;">Invalid route number: ${routeNumber}</p>`);
  }

  const row = routeMappings[routeNumber].row;

  // Retrieve single route data
  const serviceStatus = sheet.getRange(`C${row}`).getValue();
  const waitTime = sheet.getRange(`C${row + 1}`).getValue();
  const lastUpdate = sheet.getRange(`C${row + 2}`).getDisplayValue();

  // --- HTML with improved styling ---
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
        max-width: 500px;
        margin: 0 auto;
      }
      .services-card h3 {
        text-align: center;
        margin-top: 0;
        margin-bottom: 1em;
        font-weight: bold;
      }
      .label {
        font-weight: bold;
        color: #555;
      }
      .data {
        margin-bottom: 1em;
      }
      @media (max-width: 600px) {
        body {
          font-size: 18px;
        }
      }
      @media (max-width: 400px) {
        body {
          font-size: 16px;
        }
      }
    </style>

    <div class="services-card">
      <h3>Route ${routeNumber} Shuttle</h3>
      <div class="status-line">
        <div class="label">Service Status:</div>
        <div class="data">${serviceStatus}</div>
      </div>
      <div class="status-line">
        <div class="label">Approximate Wait:</div>
        <div class="data">${waitTime}</div>
      </div>
      <div class="status-line">
        <div class="label">Last Updated:</div>
        <div class="data">${lastUpdate}</div>
      </div>
    </div>
  `;

  return HtmlService.createHtmlOutput(htmlOutput)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}