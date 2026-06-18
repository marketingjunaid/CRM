"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import { User, Settings, Lock } from "lucide-react";
import { profileSchema, changePasswordSchema } from "@/lib/validations";
import { z } from "zod";
import { getDealStageColor, getTaskPriorityColor, getTaskStatusColor, formatEnumLabel, cn } from "@/lib/utils";

type ProfileInput = z.infer<typeof profileSchema>;
type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

const DEAL_STAGES = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "company">("profile");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onProfileSubmit = async (data: ProfileInput) => {
    if (!session?.user?.id) return;
    setIsProfileSaving(true);
    try {
      await axios.patch(`/api/users/${session.user.id}`, data);
      await update({ name: data.name, email: data.email });
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to update profile");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    if (!session?.user?.id) return;
    setIsPasswordSaving(true);
    try {
      await axios.patch(`/api/users/${session.user.id}`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Failed to change password");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "security" as const, label: "Security", icon: Lock },
    { id: "company" as const, label: "Company", icon: Settings },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  activeTab === id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "profile" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Profile Information</h2>
              <p className="text-sm text-gray-500 mb-6">Update your name and email address.</p>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input {...profileForm.register("name")} className="input" placeholder="John Doe" />
                  {profileForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input {...profileForm.register("email")} type="email" className="input" placeholder="john@example.com" />
                  {profileForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="pt-2">
                  <div className="p-3 bg-gray-50 rounded-lg mb-4">
                    <p className="text-xs text-gray-500">
                      <strong>Role:</strong>{" "}
                      <span className="font-medium text-gray-700">{session?.user?.role?.replace("_", " ") ?? "—"}</span>
                    </p>
                  </div>
                  <button type="submit" className="btn-primary" disabled={isProfileSaving}>
                    {isProfileSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Change Password</h2>
              <p className="text-sm text-gray-500 mb-6">Update your password. Must be at least 8 characters with an uppercase letter and number.</p>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input {...passwordForm.register("currentPassword")} type="password" className="input" placeholder="••••••••" />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">New Password</label>
                  <input {...passwordForm.register("newPassword")} type="password" className="input" placeholder="••••••••" />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">Confirm New Password</label>
                  <input {...passwordForm.register("confirmPassword")} type="password" className="input" placeholder="••••••••" />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
                <div className="pt-2">
                  <button type="submit" className="btn-primary" disabled={isPasswordSaving}>
                    {isPasswordSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Changing...
                      </span>
                    ) : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "company" && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Deal Stages</h2>
                <p className="text-sm text-gray-500 mb-4">Reference for deal pipeline stage colors used throughout the CRM.</p>
                <div className="grid grid-cols-2 gap-3">
                  {DEAL_STAGES.map((stage) => (
                    <div key={stage} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded text-xs font-medium", getDealStageColor(stage))}>
                        {formatEnumLabel(stage)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Task Priorities</h2>
                <p className="text-sm text-gray-500 mb-4">Reference for task priority colors used in the tasks view.</p>
                <div className="flex flex-wrap gap-3">
                  {TASK_PRIORITIES.map((priority) => (
                    <div key={priority} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded text-xs font-medium", getTaskPriorityColor(priority))}>
                        {priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Task Statuses</h2>
                <p className="text-sm text-gray-500 mb-4">Reference for task status colors used in the tasks view.</p>
                <div className="flex flex-wrap gap-3">
                  {TASK_STATUSES.map((status) => (
                    <div key={status} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded text-xs font-medium", getTaskStatusColor(status))}>
                        {formatEnumLabel(status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
