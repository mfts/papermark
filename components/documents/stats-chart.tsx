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
  totalPages = 0,
}: {
  documentId: string;
  totalPages?: number;
}) {
  const { stats, error } = useStats();
  const { links } = useDocumentLinks();
  const { views } = useDocumentVisits();

  const [optionsLinkData, setOptionsLinkData] = useState<optionsData[]>([]);
  const [optionsVisitorData, setOptionsVisitorData] = useState<optionsData[]>(
    []
  );
  const [chartData, setChartData] = useState<
    { pageNumber: string; avg_duration: number }[]
  >([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  let durationData = {
    data: Array.from({ length: totalPages }, (_, i) => ({
      pageNumber: (i + 1).toString(),
      avg_duration: 0,
    })),
  };

  //Initializing the chart data and all the dropdown values
  useEffect(() => {
    const swrData = stats?.duration;

    durationData.data = durationData.data.map((item: any) => {
      const swrItem = swrData?.data.find(
        (data) => data.pageNumber === item.pageNumber
      );
      return swrItem ? swrItem : item;
    });

    setChartData(durationData.data);

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
  }, []);

  if (error && error.status === 404) {
    return <ErrorPage statusCode={404} />;
  }

  if (!stats?.duration.data) {
    return <div>No data</div>;
  }

  const hanldeOptionVisitorChange = async (
    VisitorId: string,
    isChecked: boolean
  ) => {
    const updatedItems = optionsVisitorData.map((option) => {
      if (option.Id === VisitorId) {
        option.isSelected = isChecked;
      }
      return option;
    });
    setOptionsVisitorData(updatedItems);
    await refreshChart();
  };

  const hanldeOptionChange = async (LinkId: string, isChecked: boolean) => {
    const updatedItems = optionsLinkData.map((option) => {
      if (option.Id === LinkId) {
        option.isSelected = isChecked;
      }
      return option;
    });
    setOptionsLinkData(updatedItems);
    await refreshChart();
  };

  //refresh the chart upon selecting/deselcting views/links
  const refreshChart = async () => {
    setIsFilterLoading(true);
    const response = await fetch(`/api/documents/${documentId}/stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        LinkIds: optionsLinkData.filter((x) => !x.isSelected).map((x) => x.Id),
        ViewsIds: optionsVisitorData
          .filter((x) => !x.isSelected)
          .map((x) => x.Id),
      }),
    });

    if (response.ok) {
      setIsFilterLoading(false);
      const stats = await response.json();
      const swrData = stats?.duration;
      durationData.data = durationData.data.map((item) => {
        const swrItem = swrData.data.find(
          (data: any) => data.pageNumber === item.pageNumber
        );
        return swrItem ? swrItem : item;
      });
      setChartData(durationData.data);
    } else {
      setIsFilterLoading(false);
      const { message } = await response.json();
    }
  };

  return (
    <div className="p-5">
      <div className="flex">
        <div className="ps-5">
          <FilterData
            optionText="Filter Link"
            handleSelect={hanldeOptionChange}
            dropdownData={optionsLinkData}
            loading={isFilterLoading}
          />
        </div>
        <div className="ps-5">
          <FilterData
            optionText="Filter View"
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
  );
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
          <span className="ml-2">{optionText}</span>
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
              {option.Name || "No link name"}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
