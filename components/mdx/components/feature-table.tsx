import React from "react";

type Column = {
  header: string;
  key: string;
};

type Row = {
  [key: string]: string;
};

type TableProps = {
  columns: Column[];
  rows: Row[];
};

export const Table: React.FC<TableProps> = ({ columns, rows }) => {
  return (
    <div className="mt-6 flow-root">
      <div className="bg-gray- mx-4 my-2 overflow-x-auto rounded-lg border border-gray-300">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-3 py-4 text-sm text-gray-900"
                    >
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
