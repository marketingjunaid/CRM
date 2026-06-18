"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, LeadInput } from "@/lib/validations";
import { Lead, User } from "@/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface LeadFormProps {
  defaultValues?: Partial<Lead>;
  onSubmit: (data: LeadInput) => Promise<void>;
  isLoading: boolean;
}

export function LeadForm({ defaultValues, onSubmit, isLoading }: LeadFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: defaultValues?.firstName || "",
      lastName: defaultValues?.lastName || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      company: defaultValues?.company || "",
      position: defaultValues?.position || "",
      status: defaultValues?.status || "NEW",
      source: defaultValues?.source || "MANUAL",
      value: defaultValues?.value || undefined,
      notes: defaultValues?.notes || "",
      assignedToId: defaultValues?.assignedToId || "",
      companyId: defaultValues?.companyId || "",
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const { data } = await axios.get("/api/users");
      return data.data as User[];
    },
  });

  const { data: companiesData } = useQuery({
    queryKey: ["companies-list"],
    queryFn: async () => {
      const { data } = await axios.get("/api/companies?all=true");
      return data.data;
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First Name *</label>
          <input {...register("firstName")} className="input" placeholder="John" />
          {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="label">Last Name *</label>
          <input {...register("lastName")} className="input" placeholder="Doe" />
          {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input {...register("email")} type="email" className="input" placeholder="john@example.com" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register("phone")} className="input" placeholder="+1 555 0100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Company</label>
          <input {...register("company")} className="input" placeholder="Acme Inc." />
        </div>
        <div>
          <label className="label">Position</label>
          <input {...register("position")} className="input" placeholder="VP of Sales" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select {...register("status")} className="input">
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="LOST">Lost</option>
            <option value="CONVERTED">Converted</option>
          </select>
        </div>
        <div>
          <label className="label">Source</label>
          <select {...register("source")} className="input">
            <option value="MANUAL">Manual</option>
            <option value="WEBSITE">Website</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="GOOGLE_ADS">Google Ads</option>
            <option value="REFERRAL">Referral</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Deal Value ($)</label>
          <input {...register("value")} type="number" className="input" placeholder="0" min="0" />
        </div>
        <div>
          <label className="label">Assigned To</label>
          <select {...register("assignedToId")} className="input">
            <option value="">Unassigned</option>
            {usersData?.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Link to Company</label>
        <select {...register("companyId")} className="input">
          <option value="">No company</option>
          {companiesData?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea {...register("notes")} rows={3} className="input resize-none" placeholder="Additional notes..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            defaultValues?.id ? "Update Lead" : "Create Lead"
          )}
        </button>
      </div>
    </form>
  );
}
