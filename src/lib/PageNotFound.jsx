import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Plane, Home, AlertTriangle } from 'lucide-react';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F7F4EF]">
            <div className="max-w-md w-full">
                <div className="text-center space-y-5">
                    {/* 404 Error Code */}
                    <div className="space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0B2D5B] mb-2">
                            <Plane className="w-8 h-8 text-[#E8A83A]" strokeWidth={2.2} />
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">Aviation IntraZone</p>
                        <h1 className="text-7xl font-black text-[#0B2D5B] leading-none tracking-tight">404</h1>
                        <div className="h-0.5 w-16 bg-[#E8A83A] mx-auto"></div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-[#0B2D5B] uppercase tracking-tight">
                            Page Not Found
                        </h2>
                        <p className="text-[#4A4845] leading-relaxed text-sm">
                            The page <span className="font-black text-[#0B2D5B] font-mono">"{pageName}"</span> could not be found.
                        </p>
                    </div>

                    {/* Admin Note */}
                    {isFetched && authData?.isAuthenticated && authData?.user?.role === 'admin' && (
                        <div className="mt-6 p-4 bg-white rounded-md border-2 border-[#E8A83A] text-left">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 text-[#E8A83A] shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#0B2D5B]">Admin Note</p>
                                    <p className="text-sm text-[#4A4845] leading-relaxed">
                                        This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wider text-white bg-[#0B2D5B] border-2 border-[#0B2D5B] rounded-md hover:bg-[#143C75] transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}