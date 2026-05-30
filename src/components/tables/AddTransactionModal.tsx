import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../supabase/SupabaseClient";
import Dropzone from "../../../src/components/form/form-elements/DropZone";
import DatePicker from "../ui/daypicker/DayPicker";

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
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Transaction;
  mode?: "add" | "edit" | "view";
  readonly?: boolean;
}

// ─── Manila timezone utilities ────────────────────────────────────────────────

/**
 * Returns the current Manila local datetime as "YYYY-MM-DDTHH:MM"
 * (the format expected by <input type="datetime-local">).
 */
const toManilaISO = (): string => {
  return new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Manila" })
    .replace(" ", "T")
    .slice(0, 16);
};

/**
 * Converts a UTC ISO string from the DB into Manila local "YYYY-MM-DDTHH:MM"
 * for display in the datetime-local input.
 */
const utcToManila = (utcIso: string): string => {
  return new Date(utcIso)
    .toLocaleString("sv-SE", { timeZone: "Asia/Manila" })
    .replace(" ", "T")
    .slice(0, 16);
};

/**
 * Interprets a Manila local datetime string ("YYYY-MM-DDTHH:MM") as
 * Asia/Manila time and converts it to a UTC ISO string for storage.
 */
const manilaToUTC = (localStr: string): string => {
  const [date, time] = localStr.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  // Manila is UTC+8 → subtract 8 hours to get UTC
  const utc = new Date(Date.UTC(year, month - 1, day, hour - 8, minute));
  return utc.toISOString();
};

// ─────────────────────────────────────────────────────────────────────────────

export default function AddTransactionModal({
  onClose,
  onSuccess,
  initialData,
  mode = "add",
  readonly = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    reference_no: initialData?.reference_no ?? "",
    gcash_name: initialData?.gcash_name ?? "",
    mobile_number: initialData?.mobile_number ?? "",
    amount: initialData?.amount?.toString() ?? "",
    transaction_fee: initialData?.transaction_fee?.toString() ?? "",
    status: initialData?.status ?? "pending",
    claimed_by: initialData?.claimed_by ?? "",
    notes: initialData?.notes ?? "",
    proof_image: initialData?.proof_image ?? "",
    transaction_type: initialData?.transaction_type ?? "cash_in",
    // Use Manila time for display; fall back to current Manila time for new records
    created_at: initialData?.created_at
      ? utcToManila(initialData.created_at)
      : toManilaISO(),
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setForm((prev) => ({ ...prev, mobile_number: digits }));
      return;
    }

    if (name === "reference_no") {
      const digits = value.replace(/\D/g, "").slice(0, 13);
      setForm((prev) => ({ ...prev, reference_no: digits }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Stable reference — won't cause Dropzone's useCallback to re-run
  const handleFileAccepted = useCallback(async (file: File | null) => {
    if (!file) {
      setForm((prev) => ({ ...prev, proof_image: "" }));
      return;
    }

    setUploading(true);
    setError("");

    const fileName = `${Date.now()}_${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from("proof-images")
      .upload(fileName, file);

    if (uploadError) {
      setError("Image upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("proof-images")
      .getPublicUrl(data.path);

    setForm((prev) => ({ ...prev, proof_image: urlData.publicUrl }));
    setUploading(false);
  }, []);

  const handleSubmit = async () => {
    if (!form.proof_image) {
      toast.error("Please upload a proof image.");
      return;
    }

    setLoading(true);
    setError("");

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to perform this action.");
      setLoading(false);
      return;
    }

    // Base payload — no created_at (excluded from updates)
    const basePayload = {
      user_id: user.id,
      reference_no: form.reference_no,
      gcash_name: form.gcash_name,
      mobile_number: form.mobile_number,
      amount: parseFloat(form.amount),
      transaction_fee: form.transaction_fee ? parseFloat(form.transaction_fee) : null,
      status: form.status,
      claimed_by: form.claimed_by,
      claimed_at: form.status === "claimed" ? new Date().toISOString() : null,
      notes: form.notes,
      proof_image: form.proof_image,
      transaction_type: form.transaction_type,
    };

    // Only include created_at on insert, not on edit
    const payload =
      mode === "edit" && initialData
        ? basePayload
        : { ...basePayload, created_at: manilaToUTC(form.created_at) };

    const { error } =
      mode === "edit" && initialData
        ? await supabase
            .from("transactions")
            .update(payload)
            .eq("id", initialData.id)
        : await supabase.from("transactions").insert([payload]);

    if (error) {
      if (error.code === "23505" && error.message.includes("reference_no")) {
        setError("This reference number already exists. Please check and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }else {
      toast.success(mode === "edit" ? "Transaction updated!" : "Transaction added!");
      onSuccess?.();
      onClose();
    }

    setLoading(false);
  };

  const inputClass =
    "w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50">
      {/* Stop backdrop clicks from reaching the dropzone */}
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 flex flex-col max-h-[90vh] my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
            {mode === "view"
              ? "View Transaction"
              : mode === "edit"
              ? "Edit Transaction"
              : "Add Transaction"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 py-4 flex-1 pr-5">
          <div className="space-y-4 pb-4">

            {/* Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Reference No. <span className="text-error-500">*</span>
                </label>
                <input
                  name="reference_no"
                  type="text"
                  placeholder="Enter reference number"
                  value={form.reference_no}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  GCash Name <span className="text-error-500">*</span>
                </label>
                <input
                  name="gcash_name"
                  type="text"
                  placeholder="Enter GCash name"
                  value={form.gcash_name}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Mobile Number <span className="text-error-500">*</span>
                </label>
                <input
                  name="mobile_number"
                  type="text"
                  placeholder="09XXXXXXXXX"
                  value={form.mobile_number}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Transaction Type <span className="text-error-500">*</span>
                </label>
                <select
                  name="transaction_type"
                  value={form.transaction_type}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                >
                  <option value="cash_in">Cash In</option>
                  <option value="cash_out">Cash Out</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Status <span className="text-error-500">*</span>
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="claimed">Claimed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <DatePicker
                  label="Transaction Date"
                  required
                  disabled={readonly}
                  value={form.created_at}
                  onChange={(val) =>
                    setForm((prev) => ({ ...prev, created_at: val }))
                  }
                  withTime
                />
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Amount <span className="text-error-500">*</span>
                </label>
                <input
                  name="amount"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Transaction Fee
                </label>
                <input
                  name="transaction_fee"
                  type="number"
                  placeholder="0.00"
                  value={form.transaction_fee}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Claimed By <span className="text-error-500">*</span>
                </label>
                <input
                  name="claimed_by"
                  type="text"
                  placeholder="Enter name"
                  value={form.claimed_by}
                  onChange={handleChange}
                  disabled={readonly}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Row 4 — Dropzone */}
            {!readonly && (
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Proof Image <span className="text-error-500">*</span>
                </label>
                <Dropzone onFileAccepted={handleFileAccepted} />
                {uploading && (
                  <p className="mt-1 text-xs text-brand-500">
                    Uploading image...
                  </p>
                )}
                {form.proof_image && !uploading && (
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-xs text-green-500">✓ Image uploaded</p>
                    <a
                      href={form.proof_image}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View current image
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Proof Image Display (Readonly) */}
            {readonly && form.proof_image && (
              <div>
                <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                  Proof Image
                </label>
                <div className="mt-2">
                  <a
                    href={form.proof_image}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline"
                  >
                    View Proof Image
                  </a>
                </div>
              </div>
            )}

            {/* Row 5 */}
            <div>
              <label className="block mb-1 text-sm text-gray-700 dark:text-gray-400">
                Notes
              </label>
              <textarea
                name="notes"
                placeholder="Enter notes"
                value={form.notes}
                onChange={handleChange}
                disabled={readonly}
                rows={3}
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-error-500">{error}</p>}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 shrink-0 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {readonly ? "Close" : "Cancel"}
          </button>
          {!readonly && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploading}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : uploading ? "Uploading..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}