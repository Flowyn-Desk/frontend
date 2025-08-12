import { useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppState } from "@/context/AppState";
import { useToast } from "@/hooks/use-toast";

export default function ImportExport() {
  const { toast } = useToast();
  const { activeWorkspaceId } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Import/Export | Service Ticket System";
  }, []);

  function exportCSV() {
    toast({ title: "Export", description: `Would export Pending tickets for workspace ${activeWorkspaceId}.` });
  }

  function importCSV() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "No file", description: "Choose a CSV file to import." });
      return;
    }
    toast({ title: "Import", description: `Would import updates from ${file.name}.` });
  }

  function autoProcess() {
    toast({ title: "Automate", description: "Would run nightly auto-process (export -> process -> import)." });
  }

  return (
    <Layout title="Import/Export | Service Ticket System" description="Export Pending tickets and import updates by workspace.">
      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CSV Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Exports all Pending tickets for the active workspace.</p>
            <Button onClick={exportCSV}>Export Pending</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CSV Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <input ref={fileRef} type="file" accept=".csv" className="block" />
            <Button onClick={importCSV}>Import</Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Automation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Simulate a scheduled job that runs nightly.</p>
            <Button variant="secondary" onClick={autoProcess}>Run Now</Button>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
}