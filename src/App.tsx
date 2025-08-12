import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Tickets from "./pages/Tickets";
import CreateTicket from "./pages/CreateTicket";
import ImportExport from "./pages/ImportExport";
import Settings from "./pages/Settings";
import { AppStateProvider } from "@/context/AppState";
import Login from "./pages/Login";
import RequireAuth from "@/components/RequireAuth";
import { AuthProvider } from "@/context/Auth";

const AuthWrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppStateProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthWrapper>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />
              <Route path="/tickets" element={<RequireAuth><Tickets /></RequireAuth>} />
              <Route path="/create" element={<RequireAuth><CreateTicket /></RequireAuth>} />
              <Route path="/import-export" element={<RequireAuth><ImportExport /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthWrapper>
        </TooltipProvider>
      </AppStateProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;