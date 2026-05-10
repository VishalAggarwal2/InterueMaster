"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Upload,
  Save,
  FileText,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { userApi, billingApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { getInitials, parseApiError } from "@/lib/utils";
import toast from "react-hot-toast";

function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

  const { user, updateUser } = useAuthStore();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    targetRole: user?.targetRole || "",
    targetCompany: user?.targetCompany || "",
    linkedinUrl: user?.linkedinUrl || "",
    githubUrl: user?.githubUrl || "",
  });

  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyReport: true,
    streakAlert: true,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: false,
    showOnLeaderboard: true,
    shareProgress: false,
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(!!user?.resumeUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const response = await userApi.updateProfile(profileForm);
      const updated = response.data.data || response.data;
      updateUser(updated);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be smaller than 5MB");
      return;
    }

    setIsUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const response = await userApi.uploadResume(formData);
      const data = response.data.data || response.data;
      updateUser({ resumeUrl: data.url });
      setResumeUploaded(true);
      toast.success("Resume uploaded successfully!");
    } catch (error) {
      toast.error(parseApiError(error));
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const response = await billingApi.createPortalSession();
      const url = response.data?.data?.url;
      if (url) {
        window.open(url, "_blank");
      } else {
        toast("Billing not enabled in this environment");
      }
    } catch {
      toast.error("Failed to open billing portal");
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await billingApi.createCheckout("pro");
      const url = response.data?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast("Billing not enabled in this environment");
      }
    } catch {
      toast.error("Failed to start checkout");
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
              <p className="text-sm text-zinc-500 mt-1">
                Manage your account and preferences
              </p>
            </div>

            <Tabs defaultValue={defaultTab}>
              <TabsList className="mb-6 bg-zinc-800/50">
                <TabsTrigger value="profile" className="gap-1.5 text-xs">
                  <User size={13} />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-1.5 text-xs">
                  <Bell size={13} />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className="gap-1.5 text-xs">
                  <Shield size={13} />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-1.5 text-xs">
                  <CreditCard size={13} />
                  Billing
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-5">
                {/* Avatar */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="text-lg">
                          {user?.name ? getInitials(user.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-zinc-100">{user?.name}</p>
                        <p className="text-sm text-zinc-500">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge
                            variant={user?.plan === "pro" ? "indigo" : "outline"}
                            className="text-xs capitalize"
                          >
                            {user?.plan || "free"} plan
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile form */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-base">Personal Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Full Name</Label>
                        <Input
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, email: e.target.value })
                          }
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Target Role</Label>
                        <Input
                          placeholder="Software Engineer"
                          value={profileForm.targetRole}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, targetRole: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Target Company</Label>
                        <Input
                          placeholder="Google"
                          value={profileForm.targetCompany}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, targetCompany: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>LinkedIn URL</Label>
                        <Input
                          placeholder="linkedin.com/in/..."
                          value={profileForm.linkedinUrl}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, linkedinUrl: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>GitHub URL</Label>
                        <Input
                          placeholder="github.com/..."
                          value={profileForm.githubUrl}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, githubUrl: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveProfile}
                      loading={isSavingProfile}
                      variant="gradient"
                      size="sm"
                      className="gap-2"
                    >
                      <Save size={14} />
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                {/* Resume */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-base">Resume</CardTitle>
                    <CardDescription>
                      Upload your resume for personalized interview questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingResume}
                        className="border-zinc-700 text-zinc-400 hover:text-zinc-100 gap-2"
                      >
                        {isUploadingResume ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Upload size={15} />
                        )}
                        {isUploadingResume ? "Uploading..." : "Upload PDF"}
                      </Button>

                      {resumeUploaded && (
                        <div className="flex items-center gap-1.5 text-sm text-green-400">
                          <CheckCircle2 size={14} />
                          Resume uploaded
                        </div>
                      )}

                      {user?.resumeUrl && (
                        <a
                          href={user.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300"
                        >
                          <ExternalLink size={13} />
                          View
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-zinc-600 mt-2">
                      PDF only, max 5MB
                    </p>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardHeader>
                    <CardTitle className="text-base text-red-400">
                      Danger Zone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-400 mb-3">
                      Permanently delete your account and all data.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                      onClick={() => {
                        if (confirm("This will permanently delete your account. Are you sure?")) {
                          userApi.deleteAccount().then(() => {
                            window.location.href = "/";
                          });
                        }
                      }}
                    >
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-base">Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        key: "dailyReminder" as const,
                        label: "Daily Practice Reminder",
                        desc: "Get reminded to practice every day",
                      },
                      {
                        key: "weeklyReport" as const,
                        label: "Weekly Progress Report",
                        desc: "Summary of your weekly performance",
                      },
                      {
                        key: "streakAlert" as const,
                        label: "Streak Alert",
                        desc: "Alert when your streak is about to break",
                      },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-zinc-200">
                            {label}
                          </Label>
                          <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          checked={notifications[key]}
                          onCheckedChange={(v) =>
                            setNotifications({ ...notifications, [key]: v })
                          }
                        />
                      </div>
                    ))}

                    <Button
                      variant="gradient"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        userApi
                          .updateSettings({ notifications })
                          .then(() => toast.success("Notification settings saved!"))
                          .catch(() => toast.error("Failed to save"));
                      }}
                    >
                      <Save size={14} />
                      Save Preferences
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy">
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-base">Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        key: "publicProfile" as const,
                        label: "Public Profile",
                        desc: "Allow others to see your profile",
                      },
                      {
                        key: "showOnLeaderboard" as const,
                        label: "Show on Leaderboard",
                        desc: "Appear in the public leaderboard",
                      },
                      {
                        key: "shareProgress" as const,
                        label: "Share Progress",
                        desc: "Allow IntervAI to use your data to improve AI",
                      },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-zinc-200">
                            {label}
                          </Label>
                          <p className="text-xs text-zinc-600 mt-0.5">{desc}</p>
                        </div>
                        <Switch
                          checked={privacy[key]}
                          onCheckedChange={(v) =>
                            setPrivacy({ ...privacy, [key]: v })
                          }
                        />
                      </div>
                    ))}

                    <Button
                      variant="gradient"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        userApi
                          .updateSettings({ privacy })
                          .then(() => toast.success("Privacy settings saved!"))
                          .catch(() => toast.error("Failed to save"));
                      }}
                    >
                      <Save size={14} />
                      Save Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-4">
                {/* Current plan */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-500">Current Plan</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-bold text-zinc-100 capitalize">
                            {user?.plan || "Free"}
                          </span>
                          <Badge
                            variant={user?.plan === "pro" ? "indigo" : "outline"}
                            className="text-xs capitalize"
                          >
                            {user?.plan || "free"}
                          </Badge>
                        </div>
                      </div>

                      {user?.plan !== "free" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBillingPortal}
                          className="border-zinc-700 text-zinc-400 gap-1.5"
                        >
                          <ExternalLink size={13} />
                          Manage
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upgrade */}
                {user?.plan === "free" && (
                  <Card className="border-indigo-500/30 bg-indigo-500/5">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-zinc-100 mb-1">
                            Upgrade to Pro
                          </h3>
                          <p className="text-sm text-zinc-400 mb-3">
                            Get unlimited sessions, voice mode, company question banks,
                            recordings, and salary negotiation.
                          </p>
                          <div className="flex items-baseline gap-1 mb-4">
                            <span className="text-3xl font-bold text-zinc-100">$19</span>
                            <span className="text-zinc-500">/month</span>
                          </div>
                          <Button
                            variant="gradient"
                            onClick={handleUpgrade}
                            className="gap-2"
                          >
                            <CreditCard size={15} />
                            Upgrade to Pro
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Usage */}
                <Card className="border-zinc-800 bg-zinc-900/50">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-zinc-300">
                      Usage This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Sessions used</span>
                        <span className="font-medium text-zinc-200">
                          {user?.totalSessions || 0} /{" "}
                          {user?.plan === "free" ? "5" : "∞"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Account since</span>
                        <span className="font-medium text-zinc-200">
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <SettingsPage />
    </Suspense>
  );
}
