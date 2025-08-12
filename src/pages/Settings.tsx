import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppState } from "@/context/AppState";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { workspaces, activeWorkspaceId, memberships, rotateWorkspaceKey } = useAppState();
  const { toast } = useToast();
  const ws = useMemo(() => workspaces.find((w) => w.id === activeWorkspaceId), [workspaces, activeWorkspaceId]);
  const membership = useMemo(() => memberships.find((m) => m.workspaceId === activeWorkspaceId), [memberships, activeWorkspaceId]);

  const [show, setShow] = useState(false);

  if (!ws) return null;

  const canRotate = membership?.role === "owner" || membership?.role === "admin";

  return (
    <Layout title="Workspace Settings | Service Ticket System" description="View and manage workspace settings, including the workspace key.">
      <section className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="wskey">Key for {ws.name}</Label>
              <div className="flex gap-2">
                <Input id="wskey" readOnly value={show ? ws.key : "••••••••••••••••"} />
                <Button type="button" variant="secondary" onClick={() => setShow((s) => !s)}>
                  {show ? "Hide" : "Reveal"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(ws.key).then(() => toast({ title: "Copied", description: "Workspace key copied." }))}>
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">The workspace key is used for CSV export/import for this workspace.</p>
            </div>
            <div>
              <Button disabled={!canRotate} onClick={() => { rotateWorkspaceKey(ws.id); toast({ title: "Key rotated", description: "A new key has been generated." }); }}>
                Rotate Key
              </Button>
              {!canRotate && <p className="text-xs text-muted-foreground mt-2">Only owner/admin can rotate the key.</p>}
            </div>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}
