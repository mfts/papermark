import { toast } from "sonner";

export function downloadCSV(data: any[], filename: string) {
  try {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Convert data to CSV format
    const csvContent = [
      // Headers row
      headers.join(","),
      // Data rows
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle special cases
            if (value instanceof Date) {
              return value.toISOString();
            }
            if (typeof value === "string" && value.includes(",")) {
              return `"${value}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const formattedTime = new Date().toISOString().replace(/[-:Z]/g, "");
    link.setAttribute("download", `${filename}_${formattedTime}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV file downloaded successfully");
  } catch (error) {
    console.error("Error:", error);
    toast.error(
      "An error occurred while downloading the CSV. Please try again.",
    );
  }
}
