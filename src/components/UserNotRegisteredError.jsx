import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const UserNotRegisteredError = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F7F4EF] p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg border-2 border-[#0B2D5B]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 rounded-full bg-[#0B2D5B]">
            <ShieldAlert className="w-8 h-8 text-[#E8A83A]" strokeWidth={2.2} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#E8A83A] mb-1">Private · Members Only</p>
          <h1 className="text-2xl md:text-3xl font-black text-[#0B2D5B] mb-3 uppercase tracking-tight">
            Access Restricted
          </h1>
          <p className="text-[#4A4845] mb-6 leading-relaxed text-sm">
            You are not registered to use this application. Please contact the app administrator to request access.
          </p>
          <div className="p-4 bg-[#F7F4EF] rounded-md border border-black/[0.08] text-sm text-[#4A4845] text-left">
            <p className="flex items-center gap-1.5 font-black text-[#0B2D5B] uppercase tracking-wider text-xs mb-2">
              <Lock className="w-3.5 h-3.5 text-[#E8A83A]" /> If you believe this is an error
            </p>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li>Verify you are logged in with the correct account</li>
              <li>Contact the app administrator for access</li>
              <li>Try logging out and back in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;