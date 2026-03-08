import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to realtime changes on the resources table and calls `onChange` whenever
 * an INSERT, UPDATE, or DELETE occurs. Optionally filter by a column value.
 */
export function useRealtimeResources(
  onChangeCallback: () => void,
  filter?: { column: string; value: string }
) {
  useEffect(() => {
    const channelName = filter
      ? `resources-${filter.column}-${filter.value}`
      : "resources-all";

    const channelConfig: Parameters<typeof supabase.channel>[1] = undefined;

    let channel = supabase.channel(channelName);

    if (filter) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resources",
          filter: `${filter.column}=eq.${filter.value}`,
        },
        () => onChangeCallback()
      );
    } else {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "resources",
        },
        () => onChangeCallback()
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChangeCallback, filter?.column, filter?.value]);
}
