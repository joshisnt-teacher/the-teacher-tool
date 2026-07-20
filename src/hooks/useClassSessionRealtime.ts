import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Channel = ReturnType<typeof supabase.channel>;

export function useClassSessionRealtime(classSessionId: string) {
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!classSessionId) return;

    const channel = supabase.channel(`classroom:${classSessionId}`, {
      config: { broadcast: { ack: true } },
    });
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [classSessionId]);

  const sendSlideChange = useCallback((slideIndex: number) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "slide_change",
      payload: { slide_index: slideIndex },
    });
  }, []);

  const onSlideChange = useCallback((handler: (index: number) => void) => {
    const fn = (message: { payload: { slide_index: number } }) => {
      handler(message.payload.slide_index);
    };
    channelRef.current?.on("broadcast", { event: "slide_change" }, fn);
    return () => {
      channelRef.current?.off("broadcast", { event: "slide_change" }, fn);
    };
  }, []);

  return { sendSlideChange, onSlideChange };
}
