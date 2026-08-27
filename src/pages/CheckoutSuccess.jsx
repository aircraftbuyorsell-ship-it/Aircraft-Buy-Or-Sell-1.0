import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("loading");
  const [session, setSession] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("No session ID provided");
      return;
    }

    const checkSession = async () => {
      try {
        const res = await base44.functions.invoke("stripeCheckoutStatus", {
          session_id: sessionId,
        });

        if (res.data?.status === "complete") {
          setStatus("success");
          setSession(res.data);
        } else if (res.data?.status === "open") {
          setStatus("pending");
          setSession(res.data);
        } else if (res.data?.status === "expired") {
          setStatus("expired");
          setSession(res.data);
        } else {
          setStatus("error");
          setError(res.data?.error || "Could not verify session status");
        }
      } catch (err) {
        setStatus("error");
        setError(err?.response?.data?.error || err?.message || "Failed to verify payment");
        console.error("Checkout status check error:", err);
      }
    };

    checkSession();
  }, [sessionId]);

  const renderIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />;
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case "error":
      case "expired":
        return <XCircle className="w-12 h-12 text-red-600" />;
      case "pending":
        return <AlertCircle className="w-12 h-12 text-yellow-600" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <>
            <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </>
        );
      case "success":
        return (
          <>
            <h1 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your purchase. Your subscription is now active.
            </p>
            {session?.product_key && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-green-800">
                  Product: <span className="font-bold">{session.product_key}</span>
                </p>
                {session?.current_period_end && (
                  <p className="text-sm text-green-700 mt-2">
                    Valid until: {new Date(session.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </>
        );
      case "pending":
        return (
          <>
            <h1 className="text-2xl font-bold mb-2 text-yellow-700">Payment Processing</h1>
            <p className="text-gray-600 mb-4">
              Your payment is being processed. This may take a few moments.
            </p>
            <p className="text-sm text-gray-500">
              Session ID: <span className="font-mono">{sessionId}</span>
            </p>
          </>
        );
      case "expired":
        return (
          <>
            <h1 className="text-2xl font-bold mb-2 text-red-700">Session Expired</h1>
            <p className="text-gray-600">
              This checkout session has expired. Please start a new purchase.
            </p>
          </>
        );
      case "error":
        return (
          <>
            <h1 className="text-2xl font-bold mb-2 text-red-700">Payment Error</h1>
            <p className="text-gray-600 mb-2">{error}</p>
            <p className="text-sm text-gray-500">
              If this problem persists, please contact support.
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">{renderIcon()}</div>
        {renderContent()}
        <div className="mt-8 space-y-3">
          <Button
            variant="default"
            className="w-full"
            onClick={() => (window.location.href = "/")}
          >
            Return to Home
          </Button>
          {["error", "expired"].includes(status) && (
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              Try Again
            </Button>
          )}
          {status === "success" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (window.location.href = "/account")}
            >
              View My Account
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
