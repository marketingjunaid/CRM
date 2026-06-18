"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { noteSchema, NoteInput } from "@/lib/validations";
import { Note } from "@/types";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import axios from "axios";

interface NotesSectionProps {
  notes: Note[];
  entityType: "leadId" | "contactId" | "companyId" | "dealId";
  entityId: string;
  onRefresh: () => void;
  currentUserId: string;
  currentUserRole: string;
}

export function NotesSection({
  notes,
  entityType,
  entityId,
  onRefresh,
  currentUserId,
  currentUserRole,
}: NotesSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
  });

  const onSubmit = async (data: NoteInput) => {
    setIsSubmitting(true);
    try {
      await axios.post("/api/notes", { ...data, [entityType]: entityId });
      toast.success("Note added");
      reset();
      onRefresh();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/notes?id=${deleteId}`);
      toast.success("Note deleted");
      onRefresh();
    } catch {
      toast.error("Failed to delete note");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Notes ({notes.length})</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
        <div className="relative">
          <textarea
            {...register("content")}
            rows={3}
            className="input resize-none pr-12"
            placeholder="Add a note..."
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="absolute bottom-2 right-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin block" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.content && (
          <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
        )}
      </form>

      <div className="space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0 mt-0.5">
                  {note.createdBy ? getInitials(note.createdBy.name) : "?"}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">{note.createdBy?.name}</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(note.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              </div>
              {(note.createdById === currentUserId || currentUserRole === "ADMIN") && (
                <button
                  onClick={() => setDeleteId(note.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  );
}
