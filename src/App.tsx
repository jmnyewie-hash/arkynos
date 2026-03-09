import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import UpdateBanner from "@/components/UpdateBanner";
import BottomToolbar from "@/components/BottomToolbar";
import Index from "./pages/Index";
import SearchPage from "./pages/SearchPage";
import CoursePage from "./pages/CoursePage";
import ResourcePage from "./pages/ResourcePage";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminFlagsPage from "./pages/AdminFlagsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminMessagesPage from "./pages/AdminMessagesPage";
import ContactAdminPage from "./pages/ContactAdminPage";
import BrowseTagsPage from "./pages/BrowseTagsPage";
import ClassTagPage from "./pages/ClassTagPage";
import UpgradePage from "./pages/UpgradePage";
import MyLibraryPage from "./pages/MyLibraryPage";
import ViewerPage from "./pages/ViewerPage";
import OfflinePage from "./pages/OfflinePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Routes that work offline — don't redirect these
const OFFLINE_ALLOWED = ["/offline", "/library", "/view"];

function OfflineRedirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOnline(false);
    const goOnline = () => setOnline(true);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (!online) {
      const isAllowed = OFFLINE_ALLOWED.some((p) => location.pathname.startsWith(p));
      if (!isAllowed) navigate("/offline", { replace: true });
    }
  }, [online, location.pathname, navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OfflineRedirect />
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/course/:courseCode" element={<CoursePage />} />
            <Route path="/resource/:id" element={<ResourcePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/flags" element={<AdminFlagsPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/messages" element={<AdminMessagesPage />} />
            <Route path="/contact" element={<ContactAdminPage />} />
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/classes" element={<BrowseTagsPage />} />
            <Route path="/class/:tagId" element={<ClassTagPage />} />
            <Route path="/library" element={<MyLibraryPage />} />
            <Route path="/view/:id" element={<ViewerPage />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <UpdateBanner />
          <BottomToolbar />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
