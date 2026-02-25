export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: 'system',
      title: 'System Update Complete',
      message: 'Training OS v2.4.1 installed successfully',
      time: '2m ago',
      read: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'achievement',
      title: 'New Record Established',
      message: 'Personal best: 120 push-ups in single session',
      time: '1h ago',
      read: false,
      priority: 'normal'
    },
    {
      id: 3,
      type: 'challenge',
      title: 'Challenge Invitation',
      message: 'User [DELTA_RUNNER] has challenged you to 30-day streak',
      time: '3h ago',
      read: false,
      priority: 'normal'
    },
    {
      id: 4,
      type: 'system',
      title: 'Rest Day Recommended',
      message: 'System analysis suggests recovery period based on 14-day streak',
      time: '5h ago',
      read: true,
      priority: 'normal'
    },
    {
      id: 5,
      type: 'milestone',
      title: 'Milestone Achieved',
      message: 'Total training hours: 100+ logged',
      time: '1d ago',
      read: true,
      priority: 'high'
    },
    {
      id: 6,
      type: 'system',
      title: 'Data Sync Complete',
      message: 'All training data synchronized to central database',
      time: '1d ago',
      read: true,
      priority: 'low'
    },
    {
      id: 7,
      type: 'challenge',
      title: 'Challenge Complete',
      message: '7-day core training challenge completed successfully',
      time: '2d ago',
      read: true,
      priority: 'normal'
    },
    {
      id: 8,
      type: 'achievement',
      title: 'Streak Extended',
      message: 'Current training streak: 14 days consecutive',
      time: '3d ago',
      read: true,
      priority: 'normal'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="square" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'achievement':
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="#ff6600">
            <path strokeLinecap="square" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'challenge':
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="white">
            <path strokeLinecap="square" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'milestone':
        return (
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="#ff6600">
            <path strokeLinecap="square" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
            <div className="size-3 bg-[#ff6600] animate-pulse" />
            <div className="font-['JetBrains_Mono',monospace] text-[12px] text-[#ff6600] font-bold">
              {unreadCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button className="border-2 border-[#ff6600] bg-[#ff6600]/10 px-4 py-2 shrink-0">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-[#ff6600] uppercase tracking-wider font-bold">
            All ({notifications.length})
          </div>
        </button>
        <button className="border border-white/20 px-4 py-2 shrink-0 hover:bg-white/5 transition-colors">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider">
            Unread ({unreadCount})
          </div>
        </button>
        <button className="border border-white/20 px-4 py-2 shrink-0 hover:bg-white/5 transition-colors">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider">
            System
          </div>
        </button>
        <button className="border border-white/20 px-4 py-2 shrink-0 hover:bg-white/5 transition-colors">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-wider">
            Challenges
          </div>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`border p-4 relative ${
              notification.read 
                ? 'border-white/10 bg-black' 
                : 'border-[#ff6600] bg-[#ff6600]/5'
            }`}
          >
            {/* Priority Indicator */}
            {notification.priority === 'high' && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff6600]" />
            )}

            <div className="flex gap-3">
              {/* Icon */}
              <div className={`shrink-0 size-10 border flex items-center justify-center ${
                notification.read ? 'border-white/20' : 'border-[#ff6600]'
              }`}>
                {getTypeIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className={`font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wide font-bold ${
                    notification.read ? 'text-white/60' : 'text-white'
                  }`}>
                    {notification.title}
                  </div>
                  <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase shrink-0">
                    {notification.time}
                  </div>
                </div>
                
                <div className={`font-['JetBrains_Mono',monospace] text-[10px] leading-[1.4] ${
                  notification.read ? 'text-white/40' : 'text-white/70'
                }`}>
                  {notification.message}
                </div>

                {/* Type Badge */}
                <div className="mt-2">
                  <div className={`inline-block border px-2 py-1 ${
                    notification.type === 'achievement' || notification.type === 'milestone'
                      ? 'border-[#ff6600]/30 bg-[#ff6600]/10'
                      : 'border-white/10 bg-white/5'
                  }`}>
                    <div className={`font-['JetBrains_Mono',monospace] text-[8px] uppercase tracking-wider ${
                      notification.type === 'achievement' || notification.type === 'milestone'
                        ? 'text-[#ff6600]'
                        : 'text-white/40'
                    }`}>
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
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
              backgroundSize: '100% 4px'
            }} />
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button className="border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 hover:bg-white/5 transition-colors">
          Mark All Read
        </button>
        <button className="border border-white/20 text-white/60 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 hover:bg-white/5 transition-colors">
          Clear Read
        </button>
      </div>

      {/* System Info */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/30 uppercase tracking-wider text-center">
          Last sync: 32 seconds ago • {notifications.length} total alerts
        </div>
      </div>
    </div>
  );
}
