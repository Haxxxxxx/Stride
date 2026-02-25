import { Link, useNavigate } from "react-router";
import imgRectangle6 from "figma:asset/c92ce858c610970c9ceacaa61f2a4aa8318c963d.png";
import { useState, useRef } from "react";

function ProfileEditor() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("marathonbill");
  const [email, setEmail] = useState("bill@operator.sys");
  const [bio, setBio] = useState("Optimizing performance metrics. Running the protocol.");
  const [profileImage, setProfileImage] = useState(imgRectangle6);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, save to backend here
  };

  return (
    <div className="border border-white/20 p-6 mb-6">
      <div className="flex items-start gap-4 mb-6">
        <div 
          className={`size-[80px] border border-white/40 relative ${isEditing ? 'cursor-pointer hover:border-[#ff6600]' : ''}`}
          onClick={handleImageClick}
        >
          <img alt="" className="w-full h-full object-cover grayscale" src={profileImage} />
          {isEditing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          )}
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
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-[#ff6600] font-['JetBrains_Mono',monospace] text-[18px] text-white font-bold uppercase tracking-wider mb-2 px-2 py-1"
            />
          ) : (
            <div className="font-['JetBrains_Mono',monospace] text-[22px] text-white font-bold uppercase tracking-wider mb-2">
              {name}
            </div>
          )}
          
          <div className="flex items-center gap-2 mb-3">
            <div className="size-2 bg-[#ff6600] animate-pulse" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
              Active Status
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Field */}
      <div className="mb-4">
        <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/40 uppercase tracking-wider mb-2">
          Email
        </div>
        {isEditing ? (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-white/20 font-['JetBrains_Mono',monospace] text-[10px] text-white px-2 py-2"
          />
        ) : (
          <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white">
            {email}
          </div>
        )}
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
        <div className="text-center">
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
            28
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
            Days Active
          </div>
        </div>
        <div className="text-center">
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
            168
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
            Operations
          </div>
        </div>
        <div className="text-center">
          <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
            94%
          </div>
          <div className="font-['JetBrains_Mono',monospace] text-[8px] text-white/40 uppercase tracking-wide">
            Success Rate
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="flex-1 bg-[#ff6600] text-black font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-2 hover:bg-[#ff8833] transition-colors"
          >
            Save Changes
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="flex-1 border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-2 hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsEditing(true)}
          className="w-full border border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-2 hover:bg-white/5 transition-colors"
        >
          Edit Profile
        </button>
      )}
    </div>
  );
}

function ShareableProgressCard() {
  const [includeStreak, setIncludeStreak] = useState(true);
  const [includeWorkouts, setIncludeWorkouts] = useState(true);
  const [includeConsistency, setIncludeConsistency] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const shareData = {
      title: 'Training OS - Progress Report',
      text: `My Training OS Stats:\n${includeStreak ? '• 6 Day Streak\n' : ''}${includeWorkouts ? '• 168 Total Operations\n' : ''}${includeConsistency ? '• 94% Consistency Score' : ''}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Create a temporary text area to copy
        const textArea = document.createElement('textarea');
        textArea.value = shareData.text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          document.execCommand('copy');
          alert('✓ Progress stats copied!\n\nPaste to share your results.');
        } catch (copyErr) {
          // If copy also fails, show the text in an alert
          alert('Share your stats:\n\n' + shareData.text);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      // If share is cancelled or fails, show a message
      if (err instanceof Error && err.name !== 'AbortError') {
        alert('Share your stats:\n\n' + shareData.text);
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
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, white 2px, white 2px)`,
          backgroundSize: '100% 4px'
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-2 bg-[#ff6600]" />
            <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-[2px]">
              Training OS
            </div>
          </div>

          <div className="font-['JetBrains_Mono',monospace] text-[16px] text-white font-bold uppercase tracking-wider mb-1">
            marathonbill
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
                  6 <span className="text-[10px] text-white/40">DAYS</span>
                </div>
              </div>
            )}

            {includeWorkouts && (
              <div className="flex items-end justify-between border-b border-white/10 pb-2">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wide">
                  Total Operations
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                  168 <span className="text-[10px] text-white/40">OPS</span>
                </div>
              </div>
            )}

            {includeConsistency && (
              <div className="flex items-end justify-between border-b border-white/10 pb-2">
                <div className="font-['JetBrains_Mono',monospace] text-[9px] text-white/60 uppercase tracking-wide">
                  Consistency Score
                </div>
                <div className="font-['JetBrains_Mono',monospace] text-[20px] text-white font-bold">
                  94<span className="text-[10px] text-white/40">%</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-white/10">
            <div className="font-['JetBrains_Mono',monospace] text-[7px] text-white/30 uppercase tracking-wider text-center">
              2026.02.10 // Training OS v1.0
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

  const handleDisconnect = () => {
    // Clear any session data if you add it later
    // For now, just navigate to splashscreen
    navigate('/');
  };

  return (
    <div className="border border-white/20 p-6 mb-6">
      <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/60 uppercase tracking-[2px] mb-2">
        System Information
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-[#ff6600]" />
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
            Version
          </div>
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
          1.0.0
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-[#ff6600]" />
          <div className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff6600] uppercase tracking-wider">
            Last Update
          </div>
        </div>
        <div className="font-['JetBrains_Mono',monospace] text-[10px] text-white/80">
          2026.02.10
        </div>
      </div>

      {/* Disconnect Button */}
      <button 
        onClick={handleDisconnect}
        className="w-full mt-6 border-2 border-white/20 text-white font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider py-3 hover:border-white/40 hover:bg-white/5 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}

export default function Profile() {
  return (
    <div className="w-full p-6 pb-24">
      <ProfileEditor />
      <ShareableProgressCard />
      <SystemInfo />
    </div>
  );
}