import { useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useFacebookGroupAssistant() {
  const [text, setText] = useState("");
  const [postRef, setPostRef] = useState("");
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [logging, setLogging] = useState(false);
  const [message, setMessage] = useState(null);

  const check = async () => {
    if (!text.trim()) return;
    setChecking(true);
    setMessage(null);
    try {
      const { data } = await base44.functions.invoke("facebookGroupWebhook", { action: "preview", text });
      setResult(data);
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.error || "Unable to check this post." });
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  const logHandled = async () => {
    if (!result) return;
    setLogging(true);
    setMessage(null);
    try {
      const { data } = await base44.functions.invoke("facebookGroupWebhook", {
        action: "logManual",
        text,
        facebookPostId: postRef.trim() || undefined,
      });
      if (data.skipped) {
        setMessage({ type: "error", text: "Already logged — this post/ID was handled before." });
      } else {
        setMessage({ type: "success", text: "Logged. This post won't be suggested again." });
      }
    } catch (error) {
      setMessage({ type: "error", text: error?.response?.data?.error || "Unable to log this post." });
    } finally {
      setLogging(false);
    }
  };

  const reset = () => {
    setText("");
    setPostRef("");
    setResult(null);
    setMessage(null);
  };

  return { text, setText, postRef, setPostRef, result, checking, logging, message, check, logHandled, reset };
}
