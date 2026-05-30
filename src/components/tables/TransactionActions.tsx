import { useState } from "react";
import { supabase } from "../../supabase/SupabaseClient";
import AddTransactionModal from "./AddTransactionModal";
import toast from "react-hot-toast";

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
  transaction: Transaction;
  onSuccess: () => void;
}

export default function TransactionActions({ transaction, onSuccess }: Props) {
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleView = () => {
    setShowView(true);
  };

  const handleDelete = async () => {
  setDeleting(true);
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transaction.id);

  if (error) {
    toast.error("Failed to delete transaction.");
    setDeleting(false);
  } else {
    toast.success("Transaction successfully deleted!");
    setShowDeleteConfirm(false);
    setTimeout(() => onSuccess(), 1000);
    // ← no setDeleting here, component will unmount anyway
  }
};

  return (
    <>
      <div className="flex items-center gap-2">
        {/* View */}
        <button
          onClick={handleView}
          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
        >
          View
        </button>

        {/* Edit */}
        <button
          onClick={() => setShowEdit(true)}
          className="px-3 py-1 text-xs font-medium text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400 dark:hover:bg-yellow-500/20"
        >
          Edit
        </button>

        {/* Delete */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
        >
          Delete
        </button>
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <AddTransactionModal
          mode="edit"
          initialData={transaction}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            onSuccess();
          }}
        />
      )}

      {/* View Modal (Readonly) */}
      {showView && (
        <AddTransactionModal
          mode="view"
          initialData={transaction}
          readonly={true}
          onClose={() => setShowView(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90 mb-2">
              Delete Transaction
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Are you sure you want to delete reference{" "}
              <span className="font-medium text-gray-800 dark:text-white/90">
                {transaction.reference_no}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}