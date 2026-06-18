"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus, Search, Eye, Pencil, Trash2, Users } from "lucide-react";
import { Contact, PaginatedResponse } from "@/types";
import { ContactInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner, TableSkeleton } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { ContactForm } from "@/components/contacts/contact-form";
import { formatDate, getInitials } from "@/lib/utils";

export default function ContactsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Contact>>({
    queryKey: ["contacts", search, page],
    queryFn: async () => {
      const res = await axios.get("/api/contacts", {
        params: { search, page, pageSize: 10 },
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ContactInput) => axios.post("/api/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created");
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Failed to create contact"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ContactInput }) =>
      axios.patch(`/api/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact updated");
      setEditContact(null);
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
      setDeleteContact(null);
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  const isSalesUser = session?.user?.role === "SALES_USER";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your contacts</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : !data?.data.length ? (
          <EmptyState
            icon={Users}
            title="No contacts found"
            description="Add your first contact to get started."
            action={
              <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Contact
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
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Company</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Position</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Assigned To</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Created</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                            {getInitials(`${contact.firstName} ${contact.lastName}`)}
                          </div>
                          <div>
                            <Link href={`/contacts/${contact.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                              {contact.firstName} {contact.lastName}
                            </Link>
                            {contact.email && (
                              <p className="text-xs text-gray-500">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.companyRel?.name ?? contact.company ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{contact.position ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {contact.assignedTo?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(contact.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/contacts/${contact.id}`}>
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setEditContact(contact)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!isSalesUser && (
                            <button
                              onClick={() => setDeleteContact(contact)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Contact" size="lg">
        <ContactForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={!!editContact} onClose={() => setEditContact(null)} title="Edit Contact" size="lg">
        {editContact && (
          <ContactForm
            defaultValues={editContact}
            onSubmit={(data) => updateMutation.mutate({ id: editContact.id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteContact}
        onClose={() => setDeleteContact(null)}
        onConfirm={() => deleteContact && deleteMutation.mutate(deleteContact.id)}
        title="Delete Contact"
        message={`Are you sure you want to delete ${deleteContact?.firstName} ${deleteContact?.lastName}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
