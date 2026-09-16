import * as XLSX from "xlsx";

// Builds a real .xlsx file (not CSV) and triggers a browser download.
// A genuine spreadsheet sidesteps Excel's locale-dependent CSV delimiter
// (some regions expect ";" instead of "," and mangle a plain CSV on open).
export const downloadExcel = (filename, headers, rows) => {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  XLSX.writeFile(workbook, filename);
};

// Reads an uploaded .xlsx/.xls/.csv file and returns its first sheet as an
// array of row arrays (row[0] is the header row).
export const parseExcelFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
};
