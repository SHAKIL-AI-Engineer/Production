import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type User } from "@/types/api"

const USERS: User[] = [
  {
    id: "1",
    name: "Shakil Ahmed",
    email: "admin@factory.com",
    role: "admin",
    status: "active",
    avatar: null,
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "2",
    name: "Rahim Chowdhury",
    email: "rahim@factory.com",
    role: "editor",
    status: "active",
    avatar: null,
    createdAt: "2026-02-15T09:30:00Z",
  },
  {
    id: "3",
    name: "Fatima Begum",
    email: "fatima@factory.com",
    role: "viewer",
    status: "inactive",
    avatar: null,
    createdAt: "2026-03-20T11:45:00Z",
  },
  {
    id: "4",
    name: "Tariqul Islam",
    email: "tariqul@factory.com",
    role: "editor",
    status: "active",
    avatar: null,
    createdAt: "2026-04-05T14:20:00Z",
  },
]

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  editor: "Shift Supervisor",
  viewer: "Auditor",
}

const STATUS_BADGE: Record<string, { variant: "default" | "secondary"; label: string }> = {
  active: { variant: "default", label: "Active" },
  inactive: { variant: "secondary", label: "Offline" },
}

export default function UsersPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & Access Control</h1>
          <p className="text-muted-foreground text-sm">Manage plant managers, supervisors, and role assignments.</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <span>Add Member</span>
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-20">Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Email</TableHead>
              <TableHead className="text-center">Role</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right w-28">Joined</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {USERS.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="w-20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                      {user.name.charAt(0)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {user.name}
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium">{ROLE_LABELS[user.role] ?? user.role}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={STATUS_BADGE[user.status].variant}>
                    {STATUS_BADGE[user.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {user.createdAt.slice(0, 10)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
