"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import axios from "axios";
import { User, Lock, Building2, Check } from "lucide-react";
import { profileSchema, changePasswordSchema } from "@/lib/validations";
import { z } from "zod";
import { cn, getDealStageColor, getLeadStatusColor, formatEnumLabel } from "@/lib/utils";

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof changePasswordSchema>;

const DEAL_STAGES = ["PROSPECTING", "QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "LOST", "CONVERTED"];

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const user = session?.user as any;
  const [tab, setTab] = useState<"profile" | "security" | "crm">("profile");
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const handleProfileUpdate = async (data: ProfileInput) => {
    setIsLoadingProfile(true);
    try {
      await axios.patch(`/api/users/${user?.id}`, data);
      await update({ name: data.name });
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handlePasswordChange = async (data: PasswordInput) => {
    setIsLoadingPassword(true);
    try {
      await axios.patch(`/api/users/${user?.id}`, data);
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to change password");
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "crm", label: "CRM Settings", icon: Building2 },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and CRM preferences</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id as any)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  tab === id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 max-w-xl">
          {tab === "profile" && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Profile Information</h2>
              <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{formatEnumLabel(user?.role || "")}</p>
                  </div>
                </div>

                <div>
                  <label className="label">Full Name</label>
                  <input {...profileForm.register("name")} className="input" />
                  {profileForm.formState.errors.name && (
                    <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Email Address</label>
                  <input {...profileForm.register("email")} type="email" className="input" />
                  {profileForm.formState.errors.email && (
                    <p className="mt-1 text-xs text-red-600">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isLoadingProfile} className="btn-primary">
                    {isLoadingProfile ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Save Changes
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === "security" && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Change Password</h2>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
                  <input {...passwordForm.register("currentPassword")} type="password" className="input" placeholder="Your current password" />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">New Password</label>
                  <input {...passwordForm.register("newPassword")} type="password" className="input" placeholder="Min 8 chars, uppercase, number" />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
                  <input {...passwordForm.register("confirmPassword")} type="password" className="input" placeholder="Repeat new password" />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={isLoadingPassword} className="btn-primary">
                    {isLoadingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {tab === "crm" && (
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Deal Pipeline Stages</h2>
                <p className="text-sm text-gray-500 mb-4">These are the stages in your sales pipeline.</p>
                <div className="space-y-2">
                  {DEAL_STAGES.map((stage, i) => (
                    <div key={stage} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-medium text-gray-500">
                        {i + 1}
                      </div>
                      <span className={`badge ${getDealStageColor(stage)}`}>{formatEnumLabel(stage)}</span>
                      <span className="text-sm text-gray-500 ml-auto">Stage {i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Lead Statuses</h2>
                <p className="text-sm text-gray-500 mb-4">These are the statuses for your leads.</p>
                <div className="space-y-2">
                  {LEAD_STATUSES.map((status) => (
                    <div key={status} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100">
                      <span className={`badge ${getLeadStatusColor(status)}`}>{formatEnumLabel(status)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Custom stage management with drag-and-drop reordering is available in the Pro plan.
                  These stages reflect your current CRM configuration.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
