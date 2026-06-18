"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, RefreshCw, Mail, Phone, Building2, UserCircle, DollarSign, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { LoadingSpinner } from "@/components/ui/loading";
import { NotesSection } from "@/components/notes/notes-section";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LeadForm } from "@/components/leads/lead-form";
import { getLeadStatusColor, getDealStageColor, formatEnumLabel, formatDate, formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const { data: lead, isLoading: fetching, refetch } = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/leads/${id}`);
      return data;
    },
  });

  const handleUpdate = async (formData: any) => {
    setIsLoading(true);
    try {
      await axios.patch(`/api/leads/${id}`, formData);
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      setShowEdit(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/leads/${id}`);
      toast.success("Lead deleted");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      router.push("/leads");
    } catch {
      toast.error("Failed to delete lead");
      setIsDeleting(false);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    try {
      await axios.post(`/api/leads/${id}/convert`);
      toast.success("Lead converted to contact!");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to convert");
    } finally {
      setIsConverting(false);
    }
  };

  if (fetching) return <LoadingSpinner size="lg" />;
  if (!lead) return <div className="text-center py-12 text-gray-500">Lead not found</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/leads" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
          <p className="text-sm text-gray-500">{lead.company || "No company"}</p>
        </div>
        <div className="flex items-center gap-2">
          {lead.status !== "CONVERTED" && (
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="btn-secondary"
            >
              {isConverting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  Converting...
                </span>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Convert to Contact
                </>
              )}
            </button>
          )}
          <button onClick={() => setShowEdit(true)} className="btn-secondary">
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          {role !== "SALES_USER" && (
            <button onClick={() => setShowDelete(true)} className="btn-danger">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Information</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-500 mb-1">Status</dt>
                <dd>
                  <span className={`badge ${getLeadStatusColor(lead.status)}`}>
                    {formatEnumLabel(lead.status)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 mb-1">Source</dt>
                <dd className="text-sm text-gray-700">{formatEnumLabel(lead.source)}</dd>
              </div>
              {lead.email && (
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Email</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                  </dd>
                </div>
              )}
              {lead.phone && (
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Phone</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-gray-700">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {lead.phone}
                  </dd>
                </div>
              )}
              {lead.position && (
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Position</dt>
                  <dd className="text-sm text-gray-700">{lead.position}</dd>
                </div>
              )}
              {lead.value && (
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Deal Value</dt>
                  <dd className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    {formatCurrency(lead.value)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500 mb-1">Assigned To</dt>
                <dd className="flex items-center gap-1.5 text-sm text-gray-700">
                  <UserCircle className="w-3.5 h-3.5 text-gray-400" />
                  {lead.assignedTo?.name || "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 mb-1">Created</dt>
                <dd className="flex items-center gap-1.5 text-sm text-gray-700">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(lead.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          {lead.notes && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Internal Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <NotesSection
              notes={lead.notes_rel || []}
              entityType="leadId"
              entityId={id}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["lead", id] })}
              currentUserId={userId}
              currentUserRole={role}
            />
          </div>

          <div className="card">
            <ActivityTimeline activities={lead.activities || []} />
          </div>
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" size="lg">
        <LeadForm defaultValues={lead} onSubmit={handleUpdate} isLoading={isLoading} />
      </Modal>

      <ConfirmModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Delete ${lead.firstName} ${lead.lastName}? This cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
