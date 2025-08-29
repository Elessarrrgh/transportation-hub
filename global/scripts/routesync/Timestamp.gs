function createTimestamp(e) {
  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();
  var targetSheetName = "Edit Tab";
  if (sheetName === targetSheetName) {
    var targetCells = {
      "B6": "D6",
      "B10": "D10",
      "B14": "D14",
      "B18": "D18",
      "B22": "D22",
      "B26": "D26"
    };
    var editedCell = e.range.getA1Notation();
    if (targetCells.hasOwnProperty(editedCell)) {
      var timestampCell = targetCells[editedCell];
      var now = new Date();
      var easternTime = Utilities.formatDate(now, "America/New_York", "hh:mm a"); // Use Utilities.formatDate to correctly format the date to correct time zone.
      sheet.getRange(timestampCell).setValue(easternTime);
    }
  }
}