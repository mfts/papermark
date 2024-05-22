import * as XLSX from "xlsx";

type RowData = { [key: string]: any };

// Custom sort function to sort keys A, B, .. Z, AA, AB, ..
const customSort = (a: string, b: string) => {
  if (a.length === b.length) {
    return a.localeCompare(b);
  }
  return a.length - b.length;
};

export const parseSheet = async ({ fileUrl }: { fileUrl: string }) => {
  let columnData: string[] | null = null;
  let rowData: RowData[] | null = null;

  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const json: RowData[] = XLSX.utils.sheet_to_json(worksheet, {
    header: "A",
  });

  // Collect all unique keys from the JSON data
  const allKeys = Array.from(new Set(json.flatMap(Object.keys)));

  // Sort the keys alphabetically
  allKeys.sort(customSort);

  // Ensure each row has the same set of keys
  const normalizedData = json.map((row) => {
    const normalizedRow: RowData = {};
    allKeys.forEach((key) => {
      normalizedRow[key] = row[key] || "";
    });
    return normalizedRow;
  });

  columnData = allKeys;
  rowData = normalizedData;

  return { columnData, rowData };
};
