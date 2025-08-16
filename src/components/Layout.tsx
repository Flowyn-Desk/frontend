import { ReactNode, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { WorkspaceSwitcher } from "../components/WorkspaceSwitcher";
import { useAppState } from "@/context/AppState";
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button";


export default function Layout({ children, title, description }: { children: ReactNode; title?: string; description?: string }) {
  const { globalRole } = useAppState();
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {
            isAuthenticated && <>
              <nav className="flex items-center gap-6" aria-label="Primary">
                <NavLink to="/tickets" className="font-semibold">
                  Tickets
                </NavLink>
                <NavLink to="/create" className={({ isActive }) => (isActive ? "text-primary" : "text-muted-foreground")}>Create</NavLink>
                {
                  globalRole === 'MANAGER' &&
                  <><NavLink to="/import-export" className={({ isActive }) => (isActive ? "text-primary" : "text-muted-foreground")}>Import/Export</NavLink>
                    <NavLink to="/settings" className={({ isActive }) => (isActive ? "text-primary" : "text-muted-foreground")}>Settings</NavLink></>
                }
              </nav>
              <div className="flex items-center gap-4">
                <WorkspaceSwitcher />
                <div className="text-sm text-muted-foreground capitalize">Role: {globalRole}</div>
                <Button size="sm" variant="secondary" onClick={() => logout()}>Logout</Button>
              </div>
            </>
          }
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}