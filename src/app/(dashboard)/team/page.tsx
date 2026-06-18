"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { User, Role } from "@/types";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/loading";
import { formatDate, getInitials, cn } from "@/lib/utils";

const newUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  role: z.enum(["ADMIN", "MANAGER", "SALES_USER"]),
});

const editRoleSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "SALES_USER"]),
});

type NewUserInput = z.infer<typeof newUserSchema>;
type EditRoleInput = z.infer<typeof editRoleSchema>;

const roleColors: Record<Role, string> = {
  ADMIN: "bg-red-100 text-red-700",
  MANAGER: "bg-blue-100 text-blue-700",
  SALES_USER: "bg-green-100 text-green-700",
};

export default function TeamPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "SALES_USER") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await axios.get("/api/users");
      return res.data.data ?? res.data;
    },
  });

  const createForm = useForm<NewUserInput>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "SALES_USER" },
  });

  const editForm = useForm<EditRoleInput>({
    resolver: zodResolver(editRoleSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: NewUserInput) => axios.post("/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created");
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: (err: any) => toast.error(err.response?.data?.error ?? "Failed to create user"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      axios.patch(`/api/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated");
      setEditUser(null);
    },
    onError: () => toast.error("Failed to update role"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
      setDeleteUser(null);
    },
    onError: () => toast.error("Failed to delete user"),
  });

  const openEdit = (user: User) => {
    setEditUser(user);
    editForm.setValue("role", user.role);
  };

  const isAdmin = session?.user?.role === "ADMIN";

  if (status === "loading") return null;
  if (session?.user?.role === "SALES_USER") return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your team members</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : !users?.length ? (
          <EmptyState
            icon={Users}
            title="No team members"
            description="Add team members to collaborate."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Joined</th>
                  {isAdmin && (
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          {user.id === session?.user?.id && (
                            <span className="text-xs text-gray-400">(you)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", roleColors[user.role])}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Edit Role"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {user.id !== session?.user?.id && (
                            <button
                              onClick={() => setDeleteUser(user)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); createForm.reset(); }} title="Add Team Member" size="md">
        <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input {...createForm.register("name")} className="input" placeholder="John Doe" />
            {createForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="label">Email *</label>
            <input {...createForm.register("email")} type="email" className="input" placeholder="john@company.com" />
            {createForm.formState.errors.email && (
              <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="label">Password *</label>
            <input {...createForm.register("password")} type="password" className="input" placeholder="Min 8 chars, 1 uppercase, 1 number" />
            {createForm.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="label">Role</label>
            <select {...createForm.register("role")} className="input">
              <option value="SALES_USER">Sales User</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : "Create User"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit Role" size="sm">
        {editUser && (
          <form
            onSubmit={editForm.handleSubmit((data) =>
              updateRoleMutation.mutate({ id: editUser.id, role: data.role })
            )}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600">
              Change role for <strong>{editUser.name}</strong>
            </p>
            <div>
              <label className="label">Role</label>
              <select {...editForm.register("role")} className="input">
                <option value="SALES_USER">Sales User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="btn-primary" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? "Saving..." : "Save Role"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteUser?.name}? This action cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
