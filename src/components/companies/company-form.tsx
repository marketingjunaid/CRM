"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, CompanyInput } from "@/lib/validations";
import { Company } from "@/types";

interface CompanyFormProps {
  defaultValues?: Partial<Company>;
  onSubmit: (data: CompanyInput) => void;
  isLoading: boolean;
}

export function CompanyForm({ defaultValues, onSubmit, isLoading }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      website: defaultValues?.website ?? "",
      industry: defaultValues?.industry ?? "",
      address: defaultValues?.address ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Company Name *</label>
        <input {...register("name")} className="input" placeholder="Acme Corporation" />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Email</label>
          <input {...register("email")} type="email" className="input" placeholder="contact@acme.com" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register("phone")} className="input" placeholder="+1 (555) 000-0000" />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Website</label>
        <input {...register("website")} className="input" placeholder="https://acme.com" />
        {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>}
      </div>

      <div>
        <label className="label">Industry</label>
        <input {...register("industry")} className="input" placeholder="Technology, Finance, Healthcare..." />
        {errors.industry && <p className="mt-1 text-xs text-red-600">{errors.industry.message}</p>}
      </div>

      <div>
        <label className="label">Address</label>
        <input {...register("address")} className="input" placeholder="123 Main St, New York, NY 10001" />
        {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
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
            "Update Company"
          ) : (
            "Create Company"
          )}
        </button>
      </div>
    </form>
  );
}
