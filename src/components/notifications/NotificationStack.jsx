import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import PushNotification from "./PushNotification";

export default function NotificationStack() {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(
    (notification) => {
      const id = Date.now() + Math.random();
      setNotifications((prev) => [...prev, { ...notification, id }]);
      return id;
    },
    []
  );

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Expose globally for easy triggering from anywhere
  if (typeof window !== "undefined") {
    window.notificationStack = { addNotification, removeNotification };
  }

  return (
    <AnimatePresence>
      {notifications.map((notif) => (
        <PushNotification
          key={notif.id}
          {...notif}
          onDismiss={removeNotification}
        />
      ))}
    </AnimatePresence>
  );
}