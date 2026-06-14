import { Video, Camera, Mic, MicOff, VideoOff, Phone, Users } from "lucide-react";

export default function VideoCallPlaceholder({ session }) {
  const isActive = session?.status === "in_progress";

  return (
    <div className="bg-[#0c0f1a] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Video area placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-[#0f1324] to-[#0a0d18] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#1a1f3a] border border-white/[0.08] flex items-center justify-center mx-auto mb-3">
            <Video className="w-7 h-7 text-[#60a5fa]/40" />
          </div>
          <p className="text-white/30 text-sm font-bold">
            {isActive ? "Live Video Session" : "Video Call Placeholder"}
          </p>
          <p className="text-white/15 text-[11px] mt-1 max-w-xs mx-auto">
            {isActive
              ? "Real-time video call with Daily.co integration"
              : "Start the session to begin a live video call with the seller."
            }
          </p>
          {session?.video_room_url && (
            <p className="text-[10px] font-mono text-[#60a5fa]/50 mt-2 break-all px-4">{session.video_room_url}</p>
          )}
        </div>

        {/* Simulated participant corners */}
        <div className="absolute top-3 right-3 w-24 h-16 rounded-lg bg-[#1a1f3a]/60 border border-white/[0.06] flex items-center justify-center">
          <Users className="w-4 h-4 text-white/10" />
        </div>
        <div className="absolute bottom-3 left-3 w-20 h-14 rounded-lg bg-[#1a1f3a]/60 border border-white/[0.06] flex items-center justify-center">
          <Camera className="w-4 h-4 text-white/10" />
        </div>
      </div>

      {/* Controls bar */}
      <div className="px-4 py-3 bg-[#0f1324] border-t border-white/[0.05] flex items-center justify-center gap-3">
        <button className="w-10 h-10 rounded-full bg-[#1a1f3a] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
          <Mic className="w-4 h-4" />
        </button>
        <button className="w-12 h-12 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/30 flex items-center justify-center text-[#ef4444] hover:bg-[#ef4444]/30 transition-colors">
          <Phone className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 rounded-full bg-[#1a1f3a] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors">
          <Camera className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}