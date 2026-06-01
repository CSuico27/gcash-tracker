import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import { supabase } from "../../../supabase/SupabaseClient";
import TransactionActions from "../TransactionActions";
import Spinner from "../../ui/spinner/Spinner";

import ReactPaginate from 'react-paginate';

interface Transaction {
  id: string;
  reference_no: string;
  gcash_name: string;
  mobile_number: string;
  amount: number;
  transaction_fee: number | null;
  status: string;
  claimed_by: string;
  claimed_at: string | null;
  notes: string;
  proof_image: string;
  transaction_type: string;
  created_at: string;
}

interface Props {
  refreshKey: number;
}

const PAGE_SIZE = 10;

export default function BasicTableOne({ refreshKey }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async (page: number) => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error) {
      setTransactions(data || []);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  };

  // Reset to page 0 when refreshKey changes
  useEffect(() => {
    setCurrentPage(0);
  }, [refreshKey]);

  // Fetch whenever page or refreshKey changes
  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, refreshKey]);

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
  };

  const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  const formatAmount = (amount: number | null | string) =>
    `₱${typeof amount === "number" ? amount.toLocaleString("en-PH", { minimumFractionDigits: 2 }) : amount || "0.00"}`;

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "claimed":   return "success";
      case "pending":   return "warning";
      case "failed":    return "error";
      default:          return "warning";
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {["Reference No.", "GCash Name", "Mobile", "Type", "Amount", "Fee", "Status", "Claimed By", "Date", "Actions"].map((col) => (
                <TableCell
                  key={col}
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 whitespace-nowrap"
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="px-5 py-8 text-center text-gray-400 text-theme-sm" >
                  <Spinner size="sm" centered />
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="px-5 py-8 text-center text-gray-400 text-theme-sm" >
                  No transactions yet.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-white/90 font-medium whitespace-nowrap">
                    {t.reference_no}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {t.gcash_name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {t.mobile_number}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm whitespace-nowrap">
                    <Badge size="sm" color={t.transaction_type === "cash_in" ? "success" : "error"}>
                      {t.transaction_type === "cash_in" ? "Cash In" : "Cash Out"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {formatAmount(t.amount)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {t.transaction_fee != null ? formatAmount(t.transaction_fee) : "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 whitespace-nowrap">
                    <Badge size="sm" color={getBadgeColor(t.status)}>
                      {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {t.claimed_by || "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                    {formatDate(t.created_at)}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-theme-sm">
                    <TransactionActions 
                      transaction={t} 
                      onSuccess={() => {
                        // Refetch transactions when any action is successful
                        setLoading(true);
                        supabase
                          .from("transactions")
                          .select("*")
                          .order("created_at", { ascending: false })
                          .then(({ data, error }) => {
                            if (!error) setTransactions(data || []);
                            setLoading(false);
                          });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Footer */}
      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex flex-col items-center gap-2 px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of {totalCount} transactions
          </p>
          <ReactPaginate
            pageCount={Math.ceil(totalCount / PAGE_SIZE)}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            onPageChange={handlePageChange}
            forcePage={currentPage}
            containerClassName="flex items-center gap-1"
            pageClassName="rounded-lg"
            pageLinkClassName="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg block"
            activeClassName="bg-brand-500 rounded-lg"
            activeLinkClassName="!text-white"
            previousLabel="< Prev"
            nextLabel="Next >"
            previousLinkClassName="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg block"
            nextLinkClassName="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg block"
            breakLabel="..."
            breakLinkClassName="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 block"
            disabledClassName="opacity-40 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}