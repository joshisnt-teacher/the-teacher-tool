import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Channel = ReturnType<typeof supabase.channel>;

export function useClassSessionRealtime(classSessionId: string) {
  const channelRef = useRef<Channel | null>(null);
  const slideChangeHandlerRef = useRef<((index: number) => void) | null>(null);

  useEffect(() => {
    if (!classSessionId) return;

    const channel = supabase.channel(`classroom:${classSessionId}`, {
      config: { broadcast: { ack: true } },
    });
    channel.on("broadcast", { event: "slide_change" }, (message: { payload: { slide_index: number } }) => {
      slideChangeHandlerRef.current?.(message.payload.slide_index);
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
    slideChangeHandlerRef.current = handler;
    return () => {
      slideChangeHandlerRef.current = null;
    };
  }, []);

  return { sendSlideChange, onSlideChange };
}
