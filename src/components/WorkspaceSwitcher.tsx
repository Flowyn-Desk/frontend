import { useAppState } from "@/context/AppState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const WorkspaceSwitcher = () => {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useAppState();

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground" htmlFor="ws-switcher">Workspace</label>
      <Select value={activeWorkspaceId} onValueChange={setActiveWorkspace}>
        <SelectTrigger id="ws-switcher" className="w-[200px]">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
