"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { taskSchema, TaskInput } from "@/lib/validations";
import { Task, User, Lead, Contact, Deal } from "@/types";

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: TaskInput) => void;
  isLoading: boolean;
}

export function TaskForm({ defaultValues, onSubmit, isLoading }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      dueDate: defaultValues?.dueDate ? defaultValues.dueDate.split("T")[0] : "",
      priority: defaultValues?.priority ?? "MEDIUM",
      status: defaultValues?.status ?? "PENDING",
      assignedToId: defaultValues?.assignedToId ?? "",
      leadId: defaultValues?.leadId ?? "",
      contactId: defaultValues?.contactId ?? "",
      dealId: defaultValues?.dealId ?? "",
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["users-all"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data.data ?? res.data;
    },
  });

  const { data: leads } = useQuery<{ data: Lead[] }>({
    queryKey: ["leads-all"],
    queryFn: async () => {
      const res = await axios.get("/api/leads?all=true");
      return res.data;
    },
  });

  const { data: contacts } = useQuery<{ data: Contact[] }>({
    queryKey: ["contacts-all"],
    queryFn: async () => {
      const res = await axios.get("/api/contacts?all=true");
      return res.data;
    },
  });

  const { data: deals } = useQuery<{ data: Deal[] }>({
    queryKey: ["deals-all"],
    queryFn: async () => {
      const res = await axios.get("/api/deals?all=true");
      return res.data;
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input {...register("title")} className="input" placeholder="Follow up with client" />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">Description</label>
        <textarea {...register("description")} rows={3} className="input resize-none" placeholder="Task details..." />
        {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Priority</label>
          <select {...register("priority")} className="input">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          {errors.priority && <p className="mt-1 text-xs text-red-600">{errors.priority.message}</p>}
        </div>
        <div>
          <label className="label">Status</label>
          <select {...register("status")} className="input">
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>}
        </div>
      </div>

      <div>
        <label className="label">Due Date</label>
        <input {...register("dueDate")} type="date" className="input" />
        {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate.message}</p>}
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
        <label className="label">Linked Lead (optional)</label>
        <select {...register("leadId")} className="input">
          <option value="">— None —</option>
          {leads?.data?.map((l) => (
            <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>
          ))}
        </select>
        {errors.leadId && <p className="mt-1 text-xs text-red-600">{errors.leadId.message}</p>}
      </div>

      <div>
        <label className="label">Linked Contact (optional)</label>
        <select {...register("contactId")} className="input">
          <option value="">— None —</option>
          {contacts?.data?.map((c) => (
            <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
          ))}
        </select>
        {errors.contactId && <p className="mt-1 text-xs text-red-600">{errors.contactId.message}</p>}
      </div>

      <div>
        <label className="label">Linked Deal (optional)</label>
        <select {...register("dealId")} className="input">
          <option value="">— None —</option>
          {deals?.data?.map((d) => (
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
        {errors.dealId && <p className="mt-1 text-xs text-red-600">{errors.dealId.message}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : defaultValues?.id ? (
            "Update Task"
          ) : (
            "Create Task"
          )}
        </button>
      </div>
    </form>
  );
}
