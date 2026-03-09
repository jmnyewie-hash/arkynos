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
      
      // Check for updates immediately on registration
      if (r) {
        console.log("Checking for updates immediately...");
        r.update().catch(console.error);
      }
      
      // Poll every 10s for updates
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
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" />
      
      {/* Update banner */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-4 shadow-lg animate-in slide-in-from-top-2 duration-500 border-b-2 border-primary-foreground/20">
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
    </>
  );
}
