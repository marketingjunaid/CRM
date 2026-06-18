"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, Globe, Building2,
  MapPin, Calendar, Users, DollarSign,
} from "lucide-react";
import { Company, Contact, Deal } from "@/types";
import { CompanyInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { LoadingSpinner } from "@/components/ui/loading";
import { NotesSection } from "@/components/notes/notes-section";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { CompanyForm } from "@/components/companies/company-form";
import { formatDate, formatCurrency, getDealStageColor, formatEnumLabel, getInitials, cn } from "@/lib/utils";

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: company, isLoading, refetch } = useQuery<Company & { contacts?: Contact[]; deals?: Deal[]; activities?: any[] }>({
    queryKey: ["company", id],
    queryFn: async () => {
      const res = await axios.get(`/api/companies/${id}`);
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CompanyInput) => axios.patch(`/api/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      toast.success("Company updated");
      setIsEditOpen(false);
    },
    onError: () => toast.error("Failed to update company"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => axios.delete(`/api/companies/${id}`),
    onSuccess: () => {
      toast.success("Company deleted");
      router.push("/companies");
    },
    onError: () => toast.error("Failed to delete company"),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!company) return <div className="p-6 text-gray-500">Company not found.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/companies">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              {company.industry && <p className="text-sm text-gray-500">{company.industry}</p>}
            </div>
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
        {/* Left: Info + Contacts + Deals */}
        <div className="space-y-4">
          {/* Company Info */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Company Information</h2>
            <div className="space-y-3">
              {company.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${company.email}`} className="text-sm text-blue-600 hover:underline break-all">{company.email}</a>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{company.phone}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                    {company.website}
                  </a>
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{company.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">{formatDate(company.createdAt)}</span>
              </div>
            </div>
            {company.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.notes}</p>
              </div>
            )}
          </div>

          {/* Linked Contacts */}
          {company.contacts && company.contacts.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Contacts ({company.contacts.length})</h2>
              </div>
              <div className="space-y-2">
                {company.contacts.map((contact) => (
                  <Link href={`/contacts/${contact.id}`} key={contact.id}>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                        {getInitials(`${contact.firstName} ${contact.lastName}`)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                        {contact.position && <p className="text-xs text-gray-500">{contact.position}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Linked Deals */}
          {company.deals && company.deals.length > 0 && (
            <div className="card space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">Deals ({company.deals.length})</h2>
              </div>
              <div className="space-y-2">
                {company.deals.map((deal) => (
                  <Link href={`/deals/${deal.id}`} key={deal.id}>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5", getDealStageColor(deal.stage))}>
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
        </div>

        {/* Right: Notes + Activity */}
        <div className="col-span-2 space-y-6">
          <div className="card">
            <NotesSection
              notes={(company as any).notes_list ?? []}
              entityType="companyId"
              entityId={id}
              onRefresh={refetch}
              currentUserId={session?.user?.id ?? ""}
              currentUserRole={session?.user?.role ?? ""}
            />
          </div>
          <div className="card">
            <ActivityTimeline activities={(company as any).activities ?? []} />
          </div>
        </div>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Company" size="lg">
        <CompanyForm
          defaultValues={company}
          onSubmit={(data) => updateMutation.mutate(data)}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Company"
        message={`Are you sure you want to delete "${company.name}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
