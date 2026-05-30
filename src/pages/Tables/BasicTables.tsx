import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
import AddTransactionModal from "../../components/tables/AddTransactionModal";
import { useState, useEffect } from "react";

export default function BasicTables() {
  const [showModal, setShowModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  useEffect(() => {
    document.title = "GCash Transactions";
  }, []);

  return (
    <>
      <PageMeta
        title="GCash Transactions"
        description=""
      />
      <PageBreadcrumb pageTitle="GCash Transactions" />
      <div className="space-y-6">
        <ComponentCard
          title="Transactions"
          action={
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
            >
              + Add Transaction
            </button>
          }
        >
          <BasicTableOne refreshKey={refreshKey} />
        </ComponentCard>
      </div>
      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}
    </>
  );
}