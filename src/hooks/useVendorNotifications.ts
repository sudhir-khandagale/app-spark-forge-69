import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  inventory_id: string;
  metadata: any;
}

export const useVendorNotifications = (storeId: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!storeId) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("vendor_notifications")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.read).length || 0);
      setLoading(false);
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("vendor-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vendor_notifications",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // Show toast for new notifications
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === "out_of_stock" ? "destructive" : "default",
            });
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
            );
            if ((payload.new as Notification).read && !(payload.old as Notification).read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, toast]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("vendor_notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!storeId) return;

    const { error } = await supabase
      .from("vendor_notifications")
      .update({ read: true })
      .eq("store_id", storeId)
      .eq("read", false);

    if (error) {
      console.error("Error marking all as read:", error);
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
};
