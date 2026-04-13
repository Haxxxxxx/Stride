import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { logOut } from "../../services/auth";
import { storage } from "../../services/firebase";
import { getDocument, updateDocument } from "../../services/firestore";
import { useAuth } from "../contexts/AuthContext";
import { getBehaviorState } from "../utils/behaviorStore";
import { Scanline } from "./Scanline";

/** Resize an image file to max 512x512 and return as a JPEG Blob (quality 0.85) */
function resizeAvatar(file: File, maxSize = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Failed to load image")); };
    img.src = objectUrl;
  });
}

function ProfileEditor({ userDoc }: { userDoc: { callsign?: string; bio?: string; avatarUrl?: string } | null }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate from fetched user doc
  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    if (userDoc) {
      setName(userDoc.callsign ?? "");
      setBio(userDoc.bio ?? "");
      if (userDoc.avatarUrl) setProfileImage(userDoc.avatarUrl);
    }
  }, [user, userDoc]);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);

    // Resize client-side before upload (512x512 JPEG)
    let resized: Blob;
    try {
      resized = await resizeAvatar(file);
    } catch {
      setSaveError("Image could not be processed — try another file");
      return;
    }

    if (isEditing) {
      // In edit mode — stage resized blob for batch save
      setAvatarFile(new File([resized], "avatar.jpg", { type: "image/jpeg" }));
    } else {
      // Outside edit mode — upload immediately
      setSaving(true);
      setSaveError(null);
      try {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, resized, { contentType: "image/jpeg" });
        const url = await getDownloadURL(storageRef);
        await updateDocument(`users/${user.uid}`, { avatarUrl: url });
        setProfileImage(url);
      } catch (err) {
        console.warn("Avatar upload failed:", err);
        setSaveError("Upload failed — try a smaller JPEG/PNG");
        setProfileImage(null);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updates: Record<string, string> = { callsign: name, bio };

      // Upload avatar to Firebase Storage if changed
      if (avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, avatarFile, { contentType: avatarFile.type });
        const url = await getDownloadURL(storageRef);
        updates.avatarUrl = url;
        setProfileImage(url);
        setAvatarFile(null);
      }

      await updateDocument(`users/${user.uid}`, updates);
      setIsEditing(false);
    } catch (err) {
      console.warn("Failed to save profile:", err);
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveError(msg.includes("storage") || msg.includes("unauthorized") ? "Image upload failed — try a smaller JPEG/PNG" : msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-white/20 p-6 mb-6">
      <div className="flex items-start gap-4 mb-6">
        <div
          className="size-[80px] border border-white/40 relative cursor-pointer hover:border-[#ff6600] transition-colors"
          onClick={handleImageClick}
        >
          {profileImage ? (
            <img alt="" className="w-full h-full object-cover" src={profileImage} />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <svg className="size-8 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 active:opacity-100 transition-opacity">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleImageChange}
          />
        </div>
        
        <div className="flex-1">
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/40 uppercase tracking-[2px] mb-1">
            Operator ID
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              maxLength={20}
              className="w-full bg-black border border-[#ff6600] font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider mb-2 px-2 py-1"
            />
          ) : (
            <div className="font-['JetBrains_Mono',monospace] text-white font-bold uppercase tracking-wider mb-2 truncate" style={{ fontSize: name.length > 12 ? '16px' : '22px' }}>
              {name}
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const s = getBehaviorState();
              const hoursSinceWorkout = s.lastWorkoutCompletedAt > 0
                ? (Date.now() - s.lastWorkoutCompletedAt) / (1000 * 60 * 60)
                : Infinity;
              const isActive = hoursSinceWorkout < 48;
              return (
                <>
                  <div className={`size-2 ${isActive ? "bg-[#ff6600] animate-pulse" : "bg-white/30"}`} />
                  <div className={`font-['JetBrains_Mono',monospace] text-[9px] uppercase tracking-wider ${isActive ? "text-[#ff6600]" : "text-white/40"}`}>
                    {isActive ? `Active · ${s.streakDays}d streak` : "Inactive"}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* Email Field (read-only — changing email requires re-authentication) */}
      <div className="mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
          Email
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
          {email}
        </div>
      </div>

      {/* Bio Field */}
      <div className="mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
          Bio
        </div>
        {isEditing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={120}
            rows={3}
            className="w-full bg-black border border-white/20 font-['JetBrains_Mono',monospace] text-[10px] text-white px-2 py-2 resize-none"
          />
        ) : (
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
            {bio}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3 pt-4 mb-4 border-t border-white/10">
        {(() => {
          const state = getBehaviorState();
          const successRate = Math.round(
            (state.workoutsCompletedThisWeek / Math.max(state.workoutsCompletedThisWeek + state.workoutsSkippedThisWeek, 1)) * 100
          );
          return (
            <>
              <div className="text-center">
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                  {state.streakDays}
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
                  Day Streak
                </div>
              </div>
              <div className="text-center">
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                  {state.totalWorkoutsCompleted}
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
                  Operations
                </div>
              </div>
              <div className="text-center">
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                  {successRate}%
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
                  Success Rate
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {saveError && (
        <div className="mb-3 border border-red-500/30 bg-red-500/10 px-3 py-2">
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-red-400">{saveError}</div>
        </div>
      )}

      {saving && !isEditing && (
        <div className="mb-3 font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] animate-pulse uppercase tracking-wider">
          Uploading avatar...
        </div>
      )}

      {isEditing ? (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-2 hover:bg-[#ff8833] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setName(userDoc?.callsign ?? "");
              setBio(userDoc?.bio ?? "");
              setProfileImage(userDoc?.avatarUrl ?? null);
              setAvatarFile(null);
              setSaveError(null);
            }}
            className="flex-1 border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-2 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          disabled={saving}
          className="w-full border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-2 hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          Edit Profile
        </button>
      )}
    </div>
  );
}

function ShareableProgressCard({ callsign }: { callsign: string }) {
  const [includeStreak, setIncludeStreak] = useState(true);
  const [includeWorkouts, setIncludeWorkouts] = useState(true);
  const [includeConsistency, setIncludeConsistency] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const state = getBehaviorState();
  const streak = state.streakDays;
  const totalOps = state.totalWorkoutsCompleted;
  const consistency = Math.round(
    (state.workoutsCompletedThisWeek / Math.max(state.workoutsCompletedThisWeek + state.workoutsSkippedThisWeek, 1)) * 100
  );

  const handleShare = async () => {
    const shareData = {
      title: 'Training OS - Progress Report',
      text: `My Training OS Stats:\n${includeStreak ? `• ${streak} Day Streak\n` : ''}${includeWorkouts ? `• ${totalOps} Total Operations\n` : ''}${includeConsistency ? `• ${consistency}% Consistency Score` : ''}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  };

  return (
    <div className="border border-white/20 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px]">
          Progress Report
        </div>
        <div className="flex items-center gap-1">
          <div className="size-2 bg-[#ff6600]" />
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-[#ff6600] uppercase tracking-wider">
            Shareable
          </div>
        </div>
      </div>

      {/* Progress Card Preview */}
      <div 
        ref={cardRef}
        className="bg-black border-2 border-[#ff6600] p-6 mb-4 relative"
      >
        {/* Scanline effect */}
        <Scanline />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-2 bg-[#ff6600]" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-[2px]">
              Training OS
            </div>
          </div>

          <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold uppercase tracking-wider mb-1">
            {callsign || "operator"}
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide mb-5">
            Operator Progress Report
          </div>

          <div className="space-y-3">
            {includeStreak && (
              <div className="flex items-end justify-between border-b border-white/10 pb-2">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wide">
                  Current Streak
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-[#ff6600] font-bold">
                  {streak} <span className="text-[10px] text-white/40">DAYS</span>
                </div>
              </div>
            )}

            {includeWorkouts && (
              <div className="flex items-end justify-between border-b border-white/10 pb-2">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wide">
                  Total Operations
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                  {totalOps} <span className="text-[10px] text-white/40">OPS</span>
                </div>
              </div>
            )}

            {includeConsistency && (
              <div className="flex items-end justify-between border-b border-white/10 pb-2">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wide">
                  Consistency Score
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                  {consistency}<span className="text-[10px] text-white/40">%</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-white/10">
            <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/50 uppercase tracking-wider text-center">
              {(() => { const d = new Date(); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; })()} // Training OS v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Selection Checkboxes */}
      <div className="space-y-2 mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
          Include in Share:
        </div>
        
        <label className="flex items-center gap-3 cursor-pointer group">
          <div 
            className={`size-5 border flex items-center justify-center transition-colors ${
              includeStreak ? 'bg-[#ff6600] border-[#ff6600]' : 'border-white/30 group-hover:border-white/50'
            }`}
            onClick={() => setIncludeStreak(!includeStreak)}
          >
            {includeStreak && <div className="size-2.5 bg-black" />}
          </div>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
            Current Streak
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div 
            className={`size-5 border flex items-center justify-center transition-colors ${
              includeWorkouts ? 'bg-[#ff6600] border-[#ff6600]' : 'border-white/30 group-hover:border-white/50'
            }`}
            onClick={() => setIncludeWorkouts(!includeWorkouts)}
          >
            {includeWorkouts && <div className="size-2.5 bg-black" />}
          </div>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
            Total Operations
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div 
            className={`size-5 border flex items-center justify-center transition-colors ${
              includeConsistency ? 'bg-[#ff6600] border-[#ff6600]' : 'border-white/30 group-hover:border-white/50'
            }`}
            onClick={() => setIncludeConsistency(!includeConsistency)}
          >
            {includeConsistency && <div className="size-2.5 bg-black" />}
          </div>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
            Consistency Score
          </span>
        </label>
      </div>

      {/* Share Button */}
      <button 
        onClick={handleShare}
        className="w-full bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[10px] font-bold uppercase tracking-wider py-3 hover:bg-[#ff8833] transition-colors flex items-center justify-center gap-2"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="square" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share Progress
      </button>
    </div>
  );
}

function SystemInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = getBehaviorState();

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect from STRIDE? You will need to sign in again.")) return;
    await logOut();
    navigate('/');
  };

  // Last activity: most recent of last workout or last login
  const lastActivity = Math.max(state.lastWorkoutCompletedAt, state.lastLoginTimestamp);
  const lastActivityStr = lastActivity > 0
    ? (() => { const d = new Date(lastActivity); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; })()
    : "No activity";

  // Member since
  const memberSince = user?.metadata?.creationTime
    ? (() => { const d = new Date(user.metadata.creationTime); return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`; })()
    : "--";

  return (
    <div className="border border-white/20 p-6 mb-6">
      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-4">
        System Information
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 bg-[#ff6600]" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
              Last Activity
            </div>
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
            {lastActivityStr}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 bg-[#ff6600]" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
              Member Since
            </div>
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
            {memberSince}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 bg-[#ff6600]" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
              Sessions / Week
            </div>
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
            {state.workoutsCompletedThisWeek} completed
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-2 bg-[#ff6600]" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
              Alignment
            </div>
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
            {state.alignmentScore}%
          </div>
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        className="w-full mt-4 border-2 border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 hover:border-white/40 hover:bg-white/5 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [userDoc, setUserDoc] = useState<{ callsign?: string; bio?: string; avatarUrl?: string } | null>(null);
  // Force re-render on tab focus so getBehaviorState() calls in children get fresh data
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handler = () => { if (document.visibilityState === "visible") forceUpdate(k => k + 1); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    getDocument<{ callsign?: string; bio?: string; avatarUrl?: string }>(`users/${user.uid}`)
      .then((doc) => { if (doc) setUserDoc(doc); })
      .catch(console.warn);
  }, [user]);

  return (
    <div className="w-full p-6 pb-24">
      <ProfileEditor userDoc={userDoc} />
      <ShareableProgressCard callsign={userDoc?.callsign ?? ""} />
      <SystemInfo />
    </div>
  );
}