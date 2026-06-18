"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Mail, Send } from "lucide-react";
import { emailLogSchema, EmailLogInput } from "@/lib/validations";
import { EmailLog } from "@/types";
import { formatDateTime, getInitials } from "@/lib/utils";
import axios from "axios";

interface EmailLogSectionProps {
  emails: EmailLog[];
  entityType: "leadId" | "contactId";
  entityId: string;
  defaultRecipient?: string;
  onRefresh: () => void;
}

export function EmailLogSection({
  emails,
  entityType,
  entityId,
  defaultRecipient = "",
  onRefresh,
}: EmailLogSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EmailLogInput>({
    resolver: zodResolver(emailLogSchema),
    defaultValues: { recipient: defaultRecipient },
  });

  const onSubmit = async (data: EmailLogInput) => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/emails", { ...data, [entityType]: entityId });
      toast.success("Email logged");
      reset({ recipient: defaultRecipient });
      setShowForm(false);
      onRefresh();
    } catch {
      toast.error("Failed to log email");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Email History ({emails.length})</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          <Mail className="w-3.5 h-3.5" />
          Log Email
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-4 p-4 bg-blue-50 rounded-lg space-y-3">
          <div>
            <label className="label text-xs">Recipient *</label>
            <input {...register("recipient")} type="email" className="input text-sm" placeholder="recipient@example.com" />
            {errors.recipient && <p className="mt-1 text-xs text-red-600">{errors.recipient.message}</p>}
          </div>
          <div>
            <label className="label text-xs">Subject *</label>
            <input {...register("subject")} className="input text-sm" placeholder="Email subject" />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
          </div>
          <div>
            <label className="label text-xs">Message *</label>
            <textarea {...register("message")} rows={3} className="input text-sm resize-none" placeholder="Email message..." />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs px-3 py-1.5">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary text-xs px-3 py-1.5">
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Send className="w-3 h-3" />
                  Log Email
                </span>
              )}
            </button>
          </div>
        </form>
      )}

      {emails.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No emails logged yet</p>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <div key={email.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center text-xs font-medium text-cyan-700">
                    {email.createdBy ? getInitials(email.createdBy.name) : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{email.subject}</p>
                    <p className="text-xs text-gray-500">To: {email.recipient}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(email.sentAt)}</span>
              </div>
              <p className="text-sm text-gray-600 ml-8 line-clamp-2">{email.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
