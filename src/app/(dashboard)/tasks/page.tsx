"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, ClipboardList, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Task, PaginatedResponse } from "@/types";
import { TaskInput } from "@/lib/validations";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { Pagination } from "@/components/ui/pagination";
import { TaskForm } from "@/components/tasks/task-form";
import {
  formatDate, getTaskPriorityColor, getTaskStatusColor, formatEnumLabel, cn,
} from "@/lib/utils";

export default function TasksPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Task>>({
    queryKey: ["tasks", statusFilter, priorityFilter, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize: 10 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      const res = await axios.get("/api/tasks", { params });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TaskInput) => axios.post("/api/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
      setIsCreateOpen(false);
    },
    onError: () => toast.error("Failed to create task"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskInput> }) =>
      axios.patch(`/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
      setEditTask(null);
    },
    onError: () => toast.error("Failed to update task"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
      setDeleteTask(null);
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const markComplete = (task: Task) => {
    updateMutation.mutate({ id: task.id, data: { status: "COMPLETED" } });
  };

  const getLinkedEntity = (task: Task): string => {
    if (task.lead) return `Lead: ${task.lead.firstName} ${task.lead.lastName}`;
    if (task.contact) return `Contact: ${task.contact.firstName} ${task.contact.lastName}`;
    if (task.deal) return `Deal: ${task.deal.title}`;
    return "—";
  };

  const isOverdue = (task: Task): boolean => {
    if (!task.dueDate || task.status === "COMPLETED") return false;
    return new Date(task.dueDate) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your tasks and follow-ups</p>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="all">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="input w-auto"
          >
            <option value="all">All</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : !data?.data.length ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks found"
            description="Create your first task to start tracking your follow-ups."
            action={
              <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Title</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Priority</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Due Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Assigned To</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Linked To</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className={cn("text-sm font-medium", task.status === "COMPLETED" ? "text-gray-400 line-through" : "text-gray-900")}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getTaskPriorityColor(task.priority))}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getTaskStatusColor(task.status))}>
                          {formatEnumLabel(task.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {task.dueDate ? (
                          <span className={cn("text-sm", isOverdue(task) ? "text-red-600 font-medium" : "text-gray-700")}>
                            {formatDate(task.dueDate)}
                            {isOverdue(task) && <span className="ml-1 text-xs">(overdue)</span>}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{task.assignedTo?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{getLinkedEntity(task)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {task.status !== "COMPLETED" && (
                            <button
                              onClick={() => markComplete(task)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditTask(task)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTask(task)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={setPage}
                total={data.total}
                pageSize={data.pageSize}
              />
            )}
          </>
        )}
      </div>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Task" size="lg">
        <TaskForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && (
          <TaskForm
            defaultValues={editTask}
            onSubmit={(data) => updateMutation.mutate({ id: editTask.id, data })}
            isLoading={updateMutation.isPending}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={() => deleteTask && deleteMutation.mutate(deleteTask.id)}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTask?.title}"? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
