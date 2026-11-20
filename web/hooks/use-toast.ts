"use client"

import { toast as sonnerToast } from "sonner"

/**
 * Thin wrapper around sonner so the rest of the app can call `toast()` through a hook.
 */
export function useToast() {
  return {
    toast: (...args: Parameters<typeof sonnerToast>) => sonnerToast(...args),
  } as const
}
