import {
  ArrowDownIcon,
  ArrowUpIcon,
  GroupIcon,
  BoltIcon
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase/SupabaseClient";

export default function EcommerceMetrics() {
  const [todayCount, setTodayCount] = useState<number>(0);
const [monthCount, setMonthCount] = useState<number>(0);
const [yesterdayCount, setYesterdayCount] = useState<number>(0);
const [lastMonthCount, setLastMonthCount] = useState<number>(0);

useEffect(() => {
  const fetchCounts = async () => {
    const manilaOffset = 8 * 60;
    const now = new Date();
    const manilaTime = new Date(now.getTime() + manilaOffset * 60 * 1000);

    // Today
    const todayStart = new Date(manilaTime);
    todayStart.setUTCHours(0, 0, 0, 0);
    todayStart.setTime(todayStart.getTime() - manilaOffset * 60 * 1000);

    const todayEnd = new Date(manilaTime);
    todayEnd.setUTCHours(23, 59, 59, 999);
    todayEnd.setTime(todayEnd.getTime() - manilaOffset * 60 * 1000);

    // Yesterday
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    // This month
    const monthStart = new Date(manilaTime);
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    monthStart.setTime(monthStart.getTime() - manilaOffset * 60 * 1000);

    const monthEnd = new Date(manilaTime);
    const lastDay = new Date(Date.UTC(manilaTime.getUTCFullYear(), manilaTime.getUTCMonth() + 1, 0));
    monthEnd.setUTCDate(lastDay.getUTCDate());
    monthEnd.setUTCHours(23, 59, 59, 999);
    monthEnd.setTime(monthEnd.getTime() - manilaOffset * 60 * 1000);

    // Last month
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setUTCMonth(lastMonthStart.getUTCMonth() - 1);

    const lastMonthEnd = new Date(monthStart);
    lastMonthEnd.setTime(lastMonthEnd.getTime() - 1);

    const [
      { count: today },
      { count: yesterday },
      { count: month },
      { count: lastMonth },
    ] = await Promise.all([
      supabase.from("transactions").select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString())
        .lte("created_at", todayEnd.toISOString()),
      supabase.from("transactions").select("*", { count: "exact", head: true })
        .gte("created_at", yesterdayStart.toISOString())
        .lte("created_at", yesterdayEnd.toISOString()),
      supabase.from("transactions").select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString()),
      supabase.from("transactions").select("*", { count: "exact", head: true })
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString()),
    ]);

    setTodayCount(today ?? 0);
    setYesterdayCount(yesterday ?? 0);
    setMonthCount(month ?? 0);
    setLastMonthCount(lastMonth ?? 0);
  };

  fetchCounts();
}, []);

// Calculate % change
const calcChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const todayChange = calcChange(todayCount, yesterdayCount);
const monthChange = calcChange(monthCount, lastMonthCount);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              3,782
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoltIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Transactions
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {todayCount.toLocaleString()}
            </h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {monthCount.toLocaleString()} this month
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">vs yesterday</span>
              <Badge color={todayChange >= 0 ? "success" : "error"}>
                {todayChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(todayChange).toFixed(2)}%
              </Badge>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">vs last month</span>
              <Badge color={monthChange >= 0 ? "success" : "error"}>
                {monthChange >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {Math.abs(monthChange).toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
