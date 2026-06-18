"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { contactSchema, ContactInput } from "@/lib/validations";
import { Contact, User, Company } from "@/types";

interface ContactFormProps {
  defaultValues?: Partial<Contact>;
  onSubmit: (data: ContactInput) => void;
  isLoading: boolean;
}

export function ContactForm({ defaultValues, onSubmit, isLoading }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      company: defaultValues?.company ?? "",
      position: defaultValues?.position ?? "",
      notes: defaultValues?.notes ?? "",
      assignedToId: defaultValues?.assignedToId ?? "",
      companyId: defaultValues?.companyId ?? "",
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["users-all"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data.data ?? res.data;
    },
  });

  const { data: companies } = useQuery<{ data: Company[] }>({
    queryKey: ["companies-all"],
    queryFn: async () => {
      const res = await axios.get("/api/companies?all=true");
      return res.data;
    },
  });

  const companyList = companies?.data ?? [];

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

      <div>
        <label className="label">Email</label>
        <input {...register("email")} type="email" className="input" placeholder="john@example.com" />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">Phone</label>
        <input {...register("phone")} className="input" placeholder="+1 (555) 000-0000" />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="label">Company (text)</label>
        <input {...register("company")} className="input" placeholder="Acme Corp" />
        {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company.message}</p>}
      </div>

      <div>
        <label className="label">Position</label>
        <input {...register("position")} className="input" placeholder="Sales Manager" />
        {errors.position && <p className="mt-1 text-xs text-red-600">{errors.position.message}</p>}
      </div>

      <div>
        <label className="label">Linked Company</label>
        <select {...register("companyId")} className="input">
          <option value="">— None —</option>
          {companyList.map((c) => (
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
            "Update Contact"
          ) : (
            "Create Contact"
          )}
        </button>
      </div>
    </form>
  );
}
