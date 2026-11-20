"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  BellIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  FactoryIcon,
  LaptopIcon,
  LogOutIcon,
  MoonIcon,
  PackagePlusIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator as CmdSeparator,
} from "@/components/ui/command"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"

interface NotificationItem {
  id: string
  title: string
  time: string
  read: boolean
  type: "production" | "expense" | "system"
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  // Interactive Command Palette state
  const [openCommand, setOpenCommand] = React.useState(false)

  // Interactive Modals state
  const [productionModalOpen, setProductionModalOpen] = React.useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = React.useState(false)

  // Production Form State
  const [prodDate, setProdDate] = React.useState("2026-11-20")
  const [prodItems, setProdItems] = React.useState("5000")
  const [prodUnits, setProdUnits] = React.useState("pcs")
  const [prodNotes, setProdNotes] = React.useState("Day shift batch")
  const [isSubmittingProd, setIsSubmittingProd] = React.useState(false)

  // Expense Form State
  const [expDate, setExpDate] = React.useState("2026-11-20")
  const [expCategory, setExpCategory] = React.useState("Raw Material")
  const [expAmount, setExpAmount] = React.useState("1250.00")
  const [expDescription, setExpDescription] = React.useState("Fabric rolls")
  const [isSubmittingExp, setIsSubmittingExp] = React.useState(false)

  // Interactive Period Filter
  const [period, setPeriod] = React.useState("mtd")

  // Interactive Notifications State
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: "1",
      title: "Batch #4092 completed: 5,500 pcs produced",
      time: "10m ago",
      read: false,
      type: "production",
    },
    {
      id: "2",
      title: "New raw material expense logged ($1,250.50)",
      time: "45m ago",
      read: false,
      type: "expense",
    },
    {
      id: "3",
      title: "PostgreSQL database synchronized successfully",
      time: "2h ago",
      read: true,
      type: "system",
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  React.useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    setProdDate(today)
    setExpDate(today)
  }, [])

  // Global Keyboard Shortcut for Search (Ctrl+K / Cmd+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpenCommand((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Dynamic Page Title
  const getPageTitle = () => {
    if (pathname.includes("/users")) return "Team & Access Control"
    if (pathname.includes("/settings")) return "Settings & Configuration"
    return "Operations & P&L Overview"
  }

  // Handle Quick Production Submission
  const handleCreateProduction = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingProd(true)
    try {
      await api.post("/productions", {
        production_date: prodDate,
        items_produced: parseInt(prodItems, 10),
        units: prodUnits,
        notes: prodNotes,
      })
      toast.success("Production batch logged successfully!", {
        description: `${prodItems} ${prodUnits} recorded for ${prodDate}.`,
      })
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          title: `Logged ${prodItems} ${prodUnits} for ${prodDate}`,
          time: "Just now",
          read: false,
          type: "production",
        },
        ...prev,
      ])
      setProductionModalOpen(false)
    } catch (err: unknown) {
      toast.error("Failed to log production", {
        description: err instanceof Error ? err.message : "Network error",
      })
    } finally {
      setIsSubmittingProd(false)
    }
  }

  // Handle Quick Expense Submission
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingExp(true)
    try {
      await api.post("/expenses", {
        expense_date: expDate,
        category: expCategory,
        amount: parseFloat(expAmount),
        description: expDescription,
      })
      toast.success("Expense logged successfully!", {
        description: `$${expAmount} recorded under ${expCategory}.`,
      })
      setNotifications((prev) => [
        {
          id: Date.now().toString(),
          title: `Expense added: $${expAmount} (${expCategory})`,
          time: "Just now",
          read: false,
          type: "expense",
        },
        ...prev,
      ])
      setExpenseModalOpen(false)
    } catch (err: unknown) {
      toast.error("Failed to log expense", {
        description: err instanceof Error ? err.message : "Network error",
      })
    } finally {
      setIsSubmittingExp(false)
    }
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    toast.info("All notifications marked as read")
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
        {/* Left Section: Sidebar Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-1.5 font-medium">
                  <FactoryIcon className="h-3.5 w-3.5 text-primary" />
                  FactoryOps
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-foreground">
                  {getPageTitle()}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Center/Search Section */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Quick Period Selector */}
          <div className="hidden xl:flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Period:</span>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="mtd">Month to Date</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Trigger */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 sm:w-56 md:w-64 sm:justify-between sm:px-2.5 text-muted-foreground"
            onClick={() => setOpenCommand(true)}
          >
            <span className="hidden sm:inline-flex items-center gap-2 text-xs">
              <SearchIcon className="h-3.5 w-3.5" />
              <span>Search operations...</span>
            </span>
            <SearchIcon className="h-4 w-4 sm:hidden" />
            <kbd className="hidden sm:inline-flex pointer-events-none h-4 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Quick Add Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground shadow-xs">
                <PlusIcon className="h-3.5 w-3.5" />
                <span className="hidden md:inline font-medium text-xs">Action</span>
                <ChevronDownIcon className="h-3 w-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-muted-foreground">New Record</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setProductionModalOpen(true)} className="cursor-pointer gap-2 text-xs">
                <PackagePlusIcon className="h-4 w-4 text-primary" />
                <span>Log Production Batch</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExpenseModalOpen(true)} className="cursor-pointer gap-2 text-xs">
                <ReceiptIcon className="h-4 w-4 text-amber-500" />
                <span>Record Factory Expense</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/users")} className="cursor-pointer gap-2 text-xs">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <span>Manage Team</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* System Status Pill */}
          <Badge
            variant="outline"
            className="hidden lg:flex items-center gap-1.5 py-1 px-2 text-[11px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            PostgreSQL Live
          </Badge>

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 text-muted-foreground hover:text-foreground">
                <BellIcon className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-destructive" />
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs">Alerts</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={markAllNotificationsAsRead}
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-border">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-2.5 p-3 text-xs transition-colors hover:bg-muted/50 ${
                      !item.read ? "bg-muted/20" : ""
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.type === "production" && <PackagePlusIcon className="h-3.5 w-3.5 text-primary" />}
                      {item.type === "expense" && <ReceiptIcon className="h-3.5 w-3.5 text-amber-500" />}
                      {item.type === "system" && <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-medium text-foreground text-[11px] leading-tight">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 text-xs">
                <SunIcon className="h-3.5 w-3.5" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 text-xs">
                <MoonIcon className="h-3.5 w-3.5" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 text-xs">
                <LaptopIcon className="h-3.5 w-3.5" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    SA
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold leading-none">Shakil Ahmed</p>
                    <Badge variant="secondary" className="text-[10px]">Admin</Badge>
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">admin@factory.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="cursor-pointer gap-2 text-xs">
                <UserIcon className="h-4 w-4" /> Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/users")} className="cursor-pointer gap-2 text-xs">
                <UsersIcon className="h-4 w-4" /> User Management
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="cursor-pointer gap-2 text-xs">
                <SettingsIcon className="h-4 w-4" /> Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("token")
                  }
                  toast.info("Signed out successfully")
                }}
                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
              >
                <LogOutIcon className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Interactive Command Dialog */}
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Type a command or search operations..." />
        <CommandList>
          <CommandEmpty>No matching records found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                router.push("/dashboard")
                setOpenCommand(false)
              }}
            >
              <FactoryIcon className="mr-2 h-4 w-4" />
              <span>Operations & P&L Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/dashboard/users")
                setOpenCommand(false)
              }}
            >
              <UsersIcon className="mr-2 h-4 w-4" />
              <span>Team & Access Control</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/dashboard/settings")
                setOpenCommand(false)
              }}
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Factory Preferences & API Config</span>
            </CommandItem>
          </CommandGroup>
          <CmdSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                setOpenCommand(false)
                setProductionModalOpen(true)
              }}
            >
              <PackagePlusIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Log Daily Production Batch</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpenCommand(false)
                setExpenseModalOpen(true)
              }}
            >
              <ReceiptIcon className="mr-2 h-4 w-4 text-amber-500" />
              <span>Record Expense Entry</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme(theme === "dark" ? "light" : "dark")
                setOpenCommand(false)
              }}
            >
              {theme === "dark" ? <SunIcon className="mr-2 h-4 w-4" /> : <MoonIcon className="mr-2 h-4 w-4" />}
              <span>Toggle Theme (Dark / Light)</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Modal: Log Daily Production */}
      <Dialog open={productionModalOpen} onOpenChange={setProductionModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateProduction}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlusIcon className="h-5 w-5 text-primary" />
                Log Daily Production
              </DialogTitle>
              <DialogDescription>
                Record factory output for the daily batch. Values sync directly to PostgreSQL.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={prodDate}
                  onChange={(e) => setProdDate(e.target.value)}
                  className="col-span-3 h-9 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={prodItems}
                  onChange={(e) => setProdItems(e.target.value)}
                  className="col-span-3 h-9 text-xs"
                  placeholder="e.g. 5000"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Units</label>
                <Input
                  value={prodUnits}
                  onChange={(e) => setProdUnits(e.target.value)}
                  className="col-span-3 h-9 text-xs"
                  placeholder="pcs, kg, meters"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Notes</label>
                <Input
                  value={prodNotes}
                  onChange={(e) => setProdNotes(e.target.value)}
                  className="col-span-3 h-9 text-xs"
                  placeholder="Shift notes or line identifier"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setProductionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingProd}>
                {isSubmittingProd ? "Saving..." : "Save Production"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Record Factory Expense */}
      <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateExpense}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ReceiptIcon className="h-5 w-5 text-amber-500" />
                Record Factory Expense
              </DialogTitle>
              <DialogDescription>
                Track operational costs for P&L calculations. Submissions update the live PostgreSQL ledger.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="col-span-3 h-9 text-xs"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Category</label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger className="col-span-3 h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Raw Material">Raw Material</SelectItem>
                    <SelectItem value="Labor">Labor & Payroll</SelectItem>
                    <SelectItem value="Utilities">Utilities & Power</SelectItem>
                    <SelectItem value="Maintenance">Equipment Maintenance</SelectItem>
                    <SelectItem value="Logistics">Logistics & Freight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="col-span-3 h-9 text-xs"
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-xs font-medium text-muted-foreground">Description</label>
                <Input
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="col-span-3 h-9 text-xs"
                  placeholder="Supplier name or expense notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setExpenseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingExp}>
                {isSubmittingExp ? "Saving..." : "Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
