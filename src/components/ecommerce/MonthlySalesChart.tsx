import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState, useEffect } from "react";
import { supabase } from "../../supabase/SupabaseClient";

export default function MonthlySalesChart() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isOpen, setIsOpen] = useState(false);
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading] = useState(true);

  // Generate year options e.g. [2025, 2024, 2023]
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  useEffect(() => {
    const fetchMonthlyEarnings = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("transactions")
        .select("transaction_fee, transaction_type, created_at")
        .eq("status", "claimed")           // only completed transactions
        .gte("created_at", `${selectedYear}-01-01T00:00:00`)
        .lte("created_at", `${selectedYear}-12-31T23:59:59`);

      if (!error && data) {
        const totals = Array(12).fill(0);
        data.forEach((t) => {
          const month = new Date(t.created_at).getMonth(); // 0-indexed
          if (t.transaction_fee !== null) {
            totals[month] += t.transaction_fee;
          }
        });
        setMonthlyData(totals);
      }

      setLoading(false);
    };

    fetchMonthlyEarnings();
  }, [selectedYear]);

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: { title: { text: undefined } },
    grid: { yaxis: { lines: { show: true } } },
    fill: { opacity: 1 },
    tooltip: {
      x: { show: false },
      y: {
        formatter: (val: number) =>
          `₱${val.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      },
    },
  };

  const series = [
    {
      name: "Earnings",
      data: monthlyData,
    },
  ];

  function toggleDropdown() { setIsOpen(!isOpen); }
  function closeDropdown() { setIsOpen(false); }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Monthly Earnings
          </h3>
          {/* Year Selector */}
          <div className="flex gap-2 mt-1">
            {yearOptions.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  selectedYear === year
                    ? "bg-brand-500 text-white"
                    : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              View More
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {loading ? (
            <div className="flex items-center justify-center h-[180px] text-sm text-gray-400">
              Loading chart...
            </div>
          ) : (
            <Chart options={options} series={series} type="bar" height={180} />
          )}
        </div>
      </div>
    </div>
  );
}