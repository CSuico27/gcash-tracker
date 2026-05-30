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

export default function BasicTableOne({ refreshKey }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error) setTransactions(data || []);
      setLoading(false);
    };

    fetchTransactions();
  }, [refreshKey]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila" });

  const formatAmount = (amount: number) =>
    `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

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
    </div>
  );
}