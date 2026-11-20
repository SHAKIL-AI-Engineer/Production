"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  role: z.enum(["admin", "editor", "viewer"]),
  notifications: z.boolean(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export default function SettingsPage() {
  const methods = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "Shakil Ahmed",
      email: "admin@factory.com",
      role: "admin",
      notifications: true,
    },
  })

  const onSubmit = async (values: SettingsFormValues) => {
    toast.success("Settings saved successfully", {
      description: `Preferences updated for ${values.email}.`,
    })
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Preferences</h1>
        <p className="text-muted-foreground text-sm">
          Manage your factory account, alert subscriptions, and reporting parameters.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
          <CardDescription>
            Update your public operator details and operational role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={methods.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Shakil Ahmed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factory Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="admin@factory.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={methods.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange as (value: string) => void}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                          <SelectItem value="editor">Shift Supervisor (Production & Expense)</SelectItem>
                          <SelectItem value="viewer">Auditor (Read Only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Daily Production Summaries</Label>
                    <p className="text-xs text-muted-foreground">
                      Receive automated shift output and expense totals at 00:00 UTC.
                    </p>
                  </div>
                  <Switch
                    checked={methods.getValues("notifications")}
                    onCheckedChange={(checked) =>
                      methods.setValue("notifications", checked)
                    }
                  />
                </FormItem>
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                Save Preferences
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
