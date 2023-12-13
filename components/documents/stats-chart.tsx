import { useStats } from "@/lib/swr/use-stats";
import ErrorPage from "next/error";
import BarChartComponent from "../charts/bar-chart";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuPortal,
} from "../ui/dropdown-menu";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import React, { useEffect, useState } from "react";
import { useDocumentLinks, useDocumentVisits } from "@/lib/swr/use-document";
import { FilterX } from "lucide-react";
import LoadingSpinner from "../ui/loading-spinner";

type optionsData = {
  Id: string;
  Name: string;
  isSelected: boolean;
};

export default function StatsChart({
  documentId,
  teamId,
  totalPagesMax = 0,
}: {
  documentId: string;
  teamId: string;
  totalPagesMax?: number;
}) {
  const { stats, loading, error } = useStats();
  const { links } = useDocumentLinks();
  const { views } = useDocumentVisits();

  const [optionsLinkData, setOptionsLinkData] = useState<optionsData[]>([]);
  const [optionsVisitorData, setOptionsVisitorData] = useState<optionsData[]>(
    [],
  );
  const [isFiltered, setIsFiltered] = useState(false);
  const [chartData, setChartData] = useState<
    {
      pageNumber: string;
      data: {
        versionNumber: number;
        avg_duration: number;
      }[];
    }[]
  >([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  let durationData = Array.from({ length: totalPagesMax }, (_, i) => ({
    pageNumber: (i + 1).toString(),
    data: [
      {
        versionNumber: 1,
        avg_duration: 0,
      },
    ],
  }));

  const updateDurationData = (
    swrData:
      | {
          data: {
            versionNumber: number;
            pageNumber: string;
            avg_duration: number;
          }[];
        }
      | undefined,
  ) => {
    if (swrData) {
      swrData.data.forEach((dataItem) => {
        const pageIndex = durationData.findIndex(
          (item) => item.pageNumber === dataItem.pageNumber,
        );

        if (pageIndex !== -1) {
          // If page exists in the initialized array, update its data
          const versionIndex = durationData[pageIndex].data.findIndex(
            (v) => v.versionNumber === dataItem.versionNumber,
          );
          if (versionIndex === -1) {
            // If this version number doesn't exist, add it
            durationData[pageIndex].data.push({
              versionNumber: dataItem.versionNumber,
              avg_duration: dataItem.avg_duration,
            });
          } else {
            // Update existing data for this version
            durationData[pageIndex].data[versionIndex] = {
              ...durationData[pageIndex].data[versionIndex],
              avg_duration: dataItem.avg_duration,
            };
          }
        } else {
          // If this page number doesn't exist, add it with the version data
          durationData.push({
            pageNumber: dataItem.pageNumber,
            data: [
              {
                versionNumber: dataItem.versionNumber,
                avg_duration: dataItem.avg_duration,
              },
            ],
          });
        }
      });

      // Sort by page number
      durationData.sort(
        (a, b) => parseInt(a.pageNumber) - parseInt(b.pageNumber),
      );
    }
  };

  //Initializing the chart data and all the dropdown values
  useEffect(() => {
    //isFiltered checks if the component is rendered with filtered applied or without filters
    if (isFiltered) {
      if (views && views.length > 0) {
        const newOptionsVisitor: optionsData[] = views.map((options) => ({
          Id: options.id,
          Name: options.viewerEmail ? options.viewerEmail : "",
          isSelected: true,
        }));

        // Find new records not present in the current state
        const newRecords = newOptionsVisitor.filter(
          (newRecord) =>
            !optionsVisitorData.some((record) => record.Id === newRecord.Id),
        );

        // Update the state only if there are new records
        if (newRecords.length > 0) {
          setOptionsVisitorData((prevOptions) => [
            ...prevOptions,
            ...newRecords,
          ]);
        }
      }
      if (links && links.length > 0) {
        const newOptionsLink: optionsData[] = links.map((options) => ({
          Id: options.id,
          Name: options.name ? options.name : "",
          isSelected: true,
        }));

        // Find new records not present in the current state
        const newRecords = newOptionsLink.filter(
          (newRecord) =>
            !optionsLinkData.some((record) => record.Id === newRecord.Id),
        );

        // Update the state only if there are new records
        if (newRecords.length > 0) {
          setOptionsLinkData((prevOptions) => [...prevOptions, ...newRecords]);
        }
      }

      //refresh the page with filtered records
      const refresh = async () => {
        await refreshChart(false);
      };
      refresh();
    } else {
      // First time load
      const swrData = stats?.duration;
      updateDurationData(swrData);
      setChartData(durationData);

      if (links && links.length > 0) {
        const newOptionsLink: optionsData[] = links.map((options) => ({
          Id: options.id,
          Name: options.name ? options.name : "",
          isSelected: true,
        }));
        setOptionsLinkData(newOptionsLink);
      }

      if (views && views.length > 0) {
        const newOptionsVisitor: optionsData[] = views.map((options) => ({
          Id: options.id,
          Name: options.viewerEmail ? options.viewerEmail : "",
          isSelected: true,
        }));
        setOptionsVisitorData(newOptionsVisitor);
      }
    }
  }, [stats]);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (loading) {
    return <div>No data</div>;
  }

  const hanldeOptionVisitorChange = async (
    VisitorId: string,
    isChecked: boolean,
  ) => {
    const updatedItems = optionsVisitorData.map((option) => {
      if (option.Id === VisitorId) {
        option.isSelected = isChecked;
      }
      return option;
    });
    setOptionsVisitorData(updatedItems);
    setIsFiltered(updatedItems.some((x) => !x.isSelected));
    await refreshChart(true);
  };

  const hanldeOptionChange = async (LinkId: string, isChecked: boolean) => {
    const updatedItems = optionsLinkData.map((option) => {
      if (option.Id === LinkId) {
        option.isSelected = isChecked;
      }
      return option;
    });
    setOptionsLinkData(updatedItems);
    setIsFiltered(updatedItems.some((x) => !x.isSelected));
    await refreshChart(true);
  };

  //refresh the chart upon selecting/deselcting views/links
  const refreshChart = async (loader: boolean) => {
    setIsFilterLoading(loader);
    const response = await fetch(
      `/api/teams/${teamId}/documents/${documentId}/stats`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          LinkIds: optionsLinkData
            .filter((x) => !x.isSelected)
            .map((x) => x.Id),
          ViewsIds: optionsVisitorData
            .filter((x) => !x.isSelected)
            .map((x) => x.Id),
        }),
      },
    );

    if (response.ok) {
      setIsFilterLoading(false);
      const stats = await response.json();
      const swrData = stats?.duration;
      updateDurationData(swrData);
      setChartData(durationData);
    } else {
      setIsFilterLoading(false);
      const { message } = await response.json();
    }
  };

  return stats && stats.views.length > 0 ? (
    <div className="p-5">
      <div className="flex">
        <div className="ps-5">
          <FilterData
            optionText="Link"
            handleSelect={hanldeOptionChange}
            dropdownData={optionsLinkData}
            loading={isFilterLoading}
          />
        </div>
        <div className="ps-5">
          <FilterData
            optionText="View"
            handleSelect={hanldeOptionVisitorChange}
            dropdownData={optionsVisitorData}
            loading={isFilterLoading}
          />
        </div>
        <div className="ps-2">
          {isFilterLoading ? <LoadingSpinner className="ml-1 h-5 w-5" /> : null}
        </div>
      </div>
      <div>
        <BarChartComponent data={chartData} />
      </div>
    </div>
  ) : null;
}

function FilterData({
  optionText,
  dropdownData,
  loading,
  handleSelect,
}: {
  optionText: string;
  dropdownData: optionsData[];
  loading: boolean;
  handleSelect: (LinkId: string, isChecked: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center">
          <FilterX />
          <span className="ml-2">Filter {optionText}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          {dropdownData.map((option) => (
            <DropdownMenuCheckboxItem
              disabled={loading}
              checked={option.isSelected}
              onCheckedChange={(isChecked) =>
                handleSelect(option.Id, isChecked)
              }
              key={option.Id}
            >
              {option.Name ||
                (optionText == "Link" ? "No Link Name" : "Anonymous View")}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
