import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      console.log("Service Worker registered:", swUrl, r);
      // Poll every 60s for updates
      if (r) {
        setInterval(async () => {
          console.log("Checking for updates...");
          if (!(!r.installing && navigator)) return;
          if (("connection" in navigator) && !(navigator as Navigator & { onLine: boolean }).onLine) return;
          const resp = await fetch(swUrl, { cache: "no-store", headers: { "cache": "no-store", "cache-control": "no-cache" } });
          console.log("Update check response:", resp?.status);
          if (resp?.status === 200) await r.update();
        }, 10 * 1000);
      }
    },
    onNeedRefresh() {
      console.log("Need refresh triggered!");
    },
  });

  console.log("UpdateBanner render - needRefresh:", needRefresh);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-14 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-3 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium">
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
        <span>A new version of Arkynos is ready.</span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0 font-semibold"
        onClick={() => updateServiceWorker(true)}
      >
        Update & Reload
      </Button>
    </div>
  );
}
