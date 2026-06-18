"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { dealSchema, DealInput } from "@/lib/validations";
import { Deal, User, Contact, Company } from "@/types";

interface DealFormProps {
  defaultValues?: Partial<Deal>;
  onSubmit: (data: DealInput) => void;
  isLoading: boolean;
}

const STAGES = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

export function DealForm({ defaultValues, onSubmit, isLoading }: DealFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DealInput>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      value: defaultValues?.value ?? 0,
      stage: defaultValues?.stage ?? "PROSPECTING",
      expectedCloseDate: defaultValues?.expectedCloseDate
        ? defaultValues.expectedCloseDate.split("T")[0]
        : "",
      notes: defaultValues?.notes ?? "",
      contactId: defaultValues?.contactId ?? "",
      companyId: defaultValues?.companyId ?? "",
      assignedToId: defaultValues?.assignedToId ?? "",
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["users-all"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data.data ?? res.data;
    },
  });

  const { data: contacts } = useQuery<{ data: Contact[] }>({
    queryKey: ["contacts-all"],
    queryFn: async () => {
      const res = await axios.get("/api/contacts?all=true");
      return res.data;
    },
  });

  const { data: companies } = useQuery<{ data: Company[] }>({
    queryKey: ["companies-all"],
    queryFn: async () => {
      const res = await axios.get("/api/companies?all=true");
      return res.data;
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Deal Title *</label>
        <input {...register("title")} className="input" placeholder="Enterprise License Deal" />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Value ($)</label>
          <input {...register("value")} type="number" min="0" step="0.01" className="input" placeholder="0" />
          {errors.value && <p className="mt-1 text-xs text-red-600">{errors.value.message}</p>}
        </div>
        <div>
          <label className="label">Stage</label>
          <select {...register("stage")} className="input">
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
              </option>
            ))}
          </select>
          {errors.stage && <p className="mt-1 text-xs text-red-600">{errors.stage.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Expected Close Date</label>
        <input {...register("expectedCloseDate")} type="date" className="input" />
        {errors.expectedCloseDate && <p className="mt-1 text-xs text-red-600">{errors.expectedCloseDate.message}</p>}
      </div>

      <div>
        <label className="label">Contact</label>
        <select {...register("contactId")} className="input">
          <option value="">— None —</option>
          {contacts?.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
        {errors.contactId && <p className="mt-1 text-xs text-red-600">{errors.contactId.message}</p>}
      </div>

      <div>
        <label className="label">Company</label>
        <select {...register("companyId")} className="input">
          <option value="">— None —</option>
          {companies?.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.companyId && <p className="mt-1 text-xs text-red-600">{errors.companyId.message}</p>}
      </div>

      <div>
        <label className="label">Assigned To</label>
        <select {...register("assignedToId")} className="input">
          <option value="">— Unassigned —</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        {errors.assignedToId && <p className="mt-1 text-xs text-red-600">{errors.assignedToId.message}</p>}
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea {...register("notes")} rows={3} className="input resize-none" placeholder="Add notes..." />
        {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : defaultValues?.id ? (
            "Update Deal"
          ) : (
            "Create Deal"
          )}
        </button>
      </div>
    </form>
  );
}
