import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  queryCollection,
  updateDocument,
  deleteDocument,
  orderBy,
} from "../../services/firestore";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: unknown;
  read: boolean;
  priority: string;
}

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "system" | "challenge">("all");

  // Load notifications from Firestore
  useEffect(() => {
    if (!user) return;
    queryCollection<Notification>(`users/${user.uid}/notifications`, [
      orderBy("createdAt", "desc"),
    ])
      .then((docs) => setNotifications(docs))
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "system":
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="square" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "achievement":
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="#ff6600">
            <path strokeLinecap="square" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case "challenge":
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="square" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case "milestone":
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="#ff6600">
            <path strokeLinecap="square" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Filter logic
  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "system") return n.type === "system";
    if (filter === "challenge") return n.type === "challenge";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(
      unread.map((n) =>
        updateDocument(`users/${user.uid}/notifications/${n.id}`, { read: true })
      )
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Clear read notifications
  const handleClearRead = async () => {
    if (!user) return;
    const readNotifs = notifications.filter((n) => n.read);
    await Promise.all(
      readNotifs.map((n) =>
        deleteDocument(`users/${user.uid}/notifications/${n.id}`)
      )
    );
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  // Mark single as read on click
  const handleNotificationClick = async (notif: Notification) => {
    if (!user || notif.read) return;
    await updateDocument(`users/${user.uid}/notifications/${notif.id}`, { read: true }).catch(console.warn);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
  };

  const filterTabs: { key: typeof filter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "system", label: "System" },
    { key: "challenge", label: "Challenges" },
  ];

  return (
    <div className="w-full min-h-screen p-6 pb-24">
      {/* Header */}
      <div className="border-b-2 border-[#ff6600] pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-1">
              System Notifications
            </div>
            <div className="font-['JetBrains_Mono',monospace] text-[24px] text-white font-bold uppercase tracking-wider">
              Alert Feed
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && <div className="size-3 bg-[#ff6600] animate-pulse" />}
            <div className="font-['JetBrains_Mono',monospace] text-[12px] text-[#ff6600] font-bold">
              {unreadCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`border px-4 py-2 shrink-0 transition-colors ${
              filter === tab.key
                ? "border-2 border-[#ff6600] bg-[#ff6600]/10"
                : "border-white/20 hover:bg-white/5"
            }`}
          >
            <div
              className={`font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider ${
                filter === tab.key ? "text-[#ff6600] font-bold" : "text-white/60"
              }`}
            >
              {tab.label}
              {tab.count !== undefined ? ` (${tab.count})` : ""}
            </div>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-wider animate-pulse">
            Loading alerts...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-white/10 p-8 text-center">
          <div className="font-['JetBrains_Mono',monospace] text-[11px] text-white/40 uppercase tracking-wider mb-2">
            {filter === "all" ? "No alerts in the system" : `No ${filter} alerts`}
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/20 uppercase tracking-wider">
            Alerts will appear as you train
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`border p-4 relative cursor-pointer ${
                notification.read
                  ? "border-white/10 bg-black"
                  : "border-[#ff6600] bg-[#ff6600]/5"
              }`}
            >
              {/* Priority Indicator */}
              {notification.priority === "high" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6600]" />
              )}

              <div className="flex gap-3">
                {/* Icon */}
                <div
                  className={`shrink-0 size-10 border flex items-center justify-center ${
                    notification.read ? "border-white/20" : "border-[#ff6600]"
                  }`}
                >
                  {getTypeIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div
                      className={`font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wide font-bold ${
                        notification.read ? "text-white/60" : "text-white"
                      }`}
                    >
                      {notification.title}
                    </div>
                    <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase shrink-0">
                      {notification.createdAt
                        ? timeAgo(
                            notification.createdAt instanceof Date
                              ? notification.createdAt
                              : typeof notification.createdAt === "object" &&
                                  notification.createdAt !== null &&
                                  "toDate" in notification.createdAt
                                ? (notification.createdAt as { toDate: () => Date }).toDate()
                                : new Date()
                          )
                        : ""}
                    </div>
                  </div>

                  <div
                    className={`font-['JetBrains_Mono',monospace] text-[10px] leading-[1.4] ${
                      notification.read ? "text-white/40" : "text-white/70"
                    }`}
                  >
                    {notification.message}
                  </div>

                  {/* Type Badge */}
                  <div className="mt-2">
                    <div
                      className={`inline-block border px-2 py-1 ${
                        notification.type === "achievement" || notification.type === "milestone"
                          ? "border-[#ff6600]/30 bg-[#ff6600]/10"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div
                        className={`font-['JetBrains_Mono',monospace] text-[8px] uppercase tracking-wider ${
                          notification.type === "achievement" || notification.type === "milestone"
                            ? "text-[#ff6600]"
                            : "text-white/40"
                        }`}
                      >
                        {notification.type}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Read Indicator */}
                {!notification.read && (
                  <div className="shrink-0 size-2 bg-[#ff6600] animate-pulse" />
                )}
              </div>

              {/* Scanlines effect */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
                  backgroundSize: "100% 4px",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 hover:bg-white/5 transition-colors disabled:opacity-30"
        >
          Mark All Read
        </button>
        <button
          onClick={handleClearRead}
          disabled={notifications.filter((n) => n.read).length === 0}
          className="border border-white/20 text-white/60 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 hover:bg-white/5 transition-colors disabled:opacity-30"
        >
          Clear Read
        </button>
      </div>

      {/* System Info */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30 uppercase tracking-wider text-center">
          {notifications.length} total alerts
        </div>
      </div>
    </div>
  );
}
