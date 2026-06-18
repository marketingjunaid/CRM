"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Filter, Pencil, Trash2, Eye, RefreshCw, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Lead } from "@/types";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { LeadForm } from "@/components/leads/lead-form";
import { getLeadStatusColor, formatEnumLabel, formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function LeadsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading: fetching } = useQuery({
    queryKey: ["leads", search, statusFilter, sourceFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        source: sourceFilter,
        page: String(page),
        pageSize: "20",
      });
      const { data } = await axios.get(`/api/leads?${params}`);
      return data;
    },
  });

  const leads: Lead[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleCreate = async (formData: any) => {
    setIsLoading(true);
    try {
      await axios.post("/api/leads", formData);
      toast.success("Lead created successfully");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowCreate(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create lead");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editLead) return;
    setIsLoading(true);
    try {
      await axios.patch(`/api/leads/${editLead.id}`, formData);
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      setEditLead(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update lead");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteLead) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/leads/${deleteLead.id}`);
      toast.success("Lead deleted");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDeleteLead(null);
    } catch {
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total leads</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search leads..."
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="LOST">Lost</option>
            <option value="CONVERTED">Converted</option>
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="GOOGLE_ADS">Google Ads</option>
            <option value="REFERRAL">Referral</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {fetching ? (
          <TableSkeleton rows={8} cols={7} />
        ) : leads.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No leads found"
            description={search || statusFilter || sourceFilter ? "Try adjusting your filters" : "Start by adding your first lead"}
            action={
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Add Lead
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Name</th>
                    <th className="table-header">Company</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Source</th>
                    <th className="table-header">Value</th>
                    <th className="table-header">Assigned To</th>
                    <th className="table-header">Created</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <Link href={`/leads/${lead.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {lead.firstName} {lead.lastName}
                        </Link>
                        {lead.email && <div className="text-xs text-gray-500">{lead.email}</div>}
                      </td>
                      <td className="table-cell text-gray-600">{lead.company || "—"}</td>
                      <td className="table-cell">
                        <span className={`badge ${getLeadStatusColor(lead.status)}`}>
                          {formatEnumLabel(lead.status)}
                        </span>
                      </td>
                      <td className="table-cell text-gray-600">{formatEnumLabel(lead.source)}</td>
                      <td className="table-cell">{lead.value ? formatCurrency(lead.value) : "—"}</td>
                      <td className="table-cell text-gray-600">{lead.assignedTo?.name || "—"}</td>
                      <td className="table-cell text-gray-500">{formatDate(lead.createdAt)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditLead(lead)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {role !== "SALES_USER" && (
                            <button
                              onClick={() => setDeleteLead(lead)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                total={total}
                pageSize={20}
              />
            )}
          </>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Lead" size="lg">
        <LeadForm onSubmit={handleCreate} isLoading={isLoading} />
      </Modal>

      <Modal isOpen={!!editLead} onClose={() => setEditLead(null)} title="Edit Lead" size="lg">
        {editLead && (
          <LeadForm defaultValues={editLead} onSubmit={handleUpdate} isLoading={isLoading} />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteLead}
        onClose={() => setDeleteLead(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete ${deleteLead?.firstName} ${deleteLead?.lastName}? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
