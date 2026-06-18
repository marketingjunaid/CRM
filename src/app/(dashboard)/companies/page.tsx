"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus, Search, Eye, Pencil, Trash2, Building2 } from "lucide-react";
import { Company, PaginatedResponse } from "@/types";
import { CompanyInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { CompanyForm } from "@/components/companies/company-form";
import { formatDate } from "@/lib/utils";

export default function CompaniesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Company>>({
    queryKey: ["companies", search, page],
    queryFn: async () => {
      const res = await axios.get("/api/companies", {
        params: { search, page, pageSize: 10 },
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CompanyInput) => axios.post("/api/companies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created");
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Failed to create company"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyInput }) =>
      axios.patch(`/api/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated");
      setEditCompany(null);
    },
    onError: () => toast.error("Failed to update company"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
      setDeleteCompany(null);
    },
    onError: () => toast.error("Failed to delete company"),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your companies</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : !data?.data.length ? (
          <EmptyState
            icon={Building2}
            title="No companies found"
            description="Add your first company to get started."
            action={
              <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Company
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Industry</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Email</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Contacts</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Deals</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Created</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-indigo-600" />
                          </div>
                          <Link href={`/companies/${company.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                            {company.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{company.industry ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{company.email ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{company._count?.contacts ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{company._count?.deals ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(company.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/companies/${company.id}`}>
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setEditCompany(company)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCompany(company)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
                total={data.total}
                pageSize={data.pageSize}
              />
            )}
          </>
        )}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Company" size="lg">
        <CompanyForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={!!editCompany} onClose={() => setEditCompany(null)} title="Edit Company" size="lg">
        {editCompany && (
          <CompanyForm
            defaultValues={editCompany}
            onSubmit={(data) => updateMutation.mutate({ id: editCompany.id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteCompany}
        onClose={() => setDeleteCompany(null)}
        onConfirm={() => deleteCompany && deleteMutation.mutate(deleteCompany.id)}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteCompany?.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
