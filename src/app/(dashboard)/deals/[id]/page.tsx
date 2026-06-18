"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, DollarSign, Calendar, UserCircle,
  Building2, Users, ClipboardList,
} from "lucide-react";
import { Deal, Task } from "@/types";
import { DealInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LoadingSpinner } from "@/components/ui/loading";
import { NotesSection } from "@/components/notes/notes-section";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { DealForm } from "@/components/deals/deal-form";
import {
  formatDate, formatCurrency, getDealStageColor, getTaskPriorityColor,
  getTaskStatusColor, formatEnumLabel, cn,
} from "@/lib/utils";

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: deal, isLoading, refetch } = useQuery<Deal & { tasks?: Task[]; activities?: any[] }>({
    queryKey: ["deal", id],
    queryFn: async () => {
      const res = await axios.get(`/api/deals/${id}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DealInput) => axios.patch(`/api/deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      toast.success("Deal updated");
      setIsEditOpen(false);
    },
    onError: () => toast.error("Failed to update deal"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/deals/${id}`),
    onSuccess: () => {
      toast.success("Deal deleted");
      router.push("/deals");
    },
    onError: () => toast.error("Failed to delete deal"),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!deal) return <div className="p-6 text-gray-500">Deal not found.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/deals">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium mt-1", getDealStageColor(deal.stage))}>
              {formatEnumLabel(deal.stage)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsEditOpen(true)} className="btn-secondary flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button onClick={() => setIsDeleteOpen(true)} className="btn-danger flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Deal Info */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Deal Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Value</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.value)}</p>
                </div>
              </div>
              {deal.expectedCloseDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Expected Close</p>
                    <p className="text-sm text-gray-700">{formatDate(deal.expectedCloseDate)}</p>
                  </div>
                </div>
              )}
              {deal.contact && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Contact</p>
                    <Link href={`/contacts/${deal.contact.id}`} className="text-sm text-blue-600 hover:underline">
                      {deal.contact.firstName} {deal.contact.lastName}
                    </Link>
                  </div>
                </div>
              )}
              {deal.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <Link href={`/companies/${deal.company.id}`} className="text-sm text-blue-600 hover:underline">
                      {deal.company.name}
                    </Link>
                  </div>
                </div>
              )}
              {deal.assignedTo && (
                <div className="flex items-center gap-3">
                  <UserCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="text-sm text-gray-700">{deal.assignedTo.name}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm text-gray-700">{formatDate(deal.createdAt)}</p>
                </div>
              </div>
            </div>
            {deal.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
              </div>
            )}
          </div>

          {/* Tasks */}
          {deal.tasks && deal.tasks.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Tasks ({deal.tasks.length})</h2>
              </div>
              <div className="space-y-2">
                {deal.tasks.map((task) => (
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
              notes={(deal as any).notesList ?? []}
              entityType="dealId"
              entityId={id}
              onRefresh={refetch}
              currentUserId={session?.user?.id ?? ""}
              currentUserRole={session?.user?.role ?? ""}
            />
          </div>
          <div className="card">
            <ActivityTimeline activities={(deal as any).activities ?? []} />
          </div>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Deal" size="lg">
        <DealForm
          defaultValues={deal}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deal.title}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
