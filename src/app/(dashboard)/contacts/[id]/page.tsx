"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Briefcase,
  UserCircle, Calendar, DollarSign, ClipboardList,
} from "lucide-react";
import { Contact, Deal, Task } from "@/types";
import { ContactInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LoadingSpinner } from "@/components/ui/loading";
import { NotesSection } from "@/components/notes/notes-section";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { ContactForm } from "@/components/contacts/contact-form";
import { formatDate, formatCurrency, getDealStageColor, getTaskPriorityColor, getTaskStatusColor, formatEnumLabel, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: contact, isLoading, refetch } = useQuery<Contact & { deals?: Deal[]; tasks?: Task[]; activities?: any[] }>({
    queryKey: ["contact", id],
    queryFn: async () => {
      const res = await axios.get(`/api/contacts/${id}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ContactInput) => axios.patch(`/api/contacts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      toast.success("Contact updated");
      setIsEditOpen(false);
    },
    onError: () => toast.error("Failed to update contact"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/contacts/${id}`),
    onSuccess: () => {
      toast.success("Contact deleted");
      router.push("/contacts");
    },
    onError: () => toast.error("Failed to delete contact"),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!contact) return <div className="p-6 text-gray-500">Contact not found.</div>;

  const isSalesUser = session?.user?.role === "SALES_USER";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/contacts">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
              {getInitials(`${contact.firstName} ${contact.lastName}`)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {contact.firstName} {contact.lastName}
              </h1>
              {contact.position && (
                <p className="text-sm text-gray-500">{contact.position}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditOpen(true)} className="btn-secondary flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          {!isSalesUser && (
            <button onClick={() => setIsDeleteOpen(true)} className="btn-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Contact Info */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Contact Information</h2>
            <div className="space-y-3">
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline break-all">{contact.email}</a>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{contact.phone}</span>
                </div>
              )}
              {(contact.companyRel?.name || contact.company) && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {contact.companyRel ? (
                    <Link href={`/companies/${contact.companyRel.id}`} className="text-sm text-blue-600 hover:underline">
                      {contact.companyRel.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-700">{contact.company}</span>
                  )}
                </div>
              )}
              {contact.position && (
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{contact.position}</span>
                </div>
              )}
              {contact.assignedTo && (
                <div className="flex items-center gap-3">
                  <UserCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{contact.assignedTo.name}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">{formatDate(contact.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Associated Deals */}
          {contact.deals && contact.deals.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Deals ({contact.deals.length})</h2>
              </div>
              <div className="space-y-2">
                {contact.deals.map((deal) => (
                  <Link href={`/deals/${deal.id}`} key={deal.id}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getDealStageColor(deal.stage))}>
                          {formatEnumLabel(deal.stage)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{formatCurrency(deal.value)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Associated Tasks */}
          {contact.tasks && contact.tasks.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Tasks ({contact.tasks.length})</h2>
              </div>
              <div className="space-y-2">
                {contact.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium", getTaskPriorityColor(task.priority))}>
                          {task.priority}
                        </span>
                        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium", getTaskStatusColor(task.status))}>
                          {formatEnumLabel(task.status)}
                        </span>
                      </div>
                    </div>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">{formatDate(task.dueDate)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Notes + Activity */}
        <div className="col-span-2 space-y-6">
          <div className="card">
            <NotesSection
              notes={(contact as any).notes ?? []}
              entityType="contactId"
              entityId={id}
              onRefresh={refetch}
              currentUserId={session?.user?.id ?? ""}
              currentUserRole={session?.user?.role ?? ""}
            />
          </div>
          <div className="card">
            <ActivityTimeline activities={(contact as any).activities ?? []} />
          </div>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Contact" size="lg">
        <ContactForm
          defaultValues={contact}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Contact"
        message={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
