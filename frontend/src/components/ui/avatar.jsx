import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", {
  variants: {
    size: {
      sm: "h-8 w-8",
      default: "h-10 w-10",
      lg: "h-16 w-16",
    },
  },
  defaultVariants: { size: "default" },
})

function Avatar({ className, size, children, ...props }) {
  return (
    <span className={cn(avatarVariants({ size, className }))} {...props}>
      {children}
    </span>
  )
}

function AvatarImage({ className, ...props }) {
  return (
    <img
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, children }) {
  return (
    <span className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium", className)}>
      {children}
    </span>
  )
}

export { Avatar, AvatarImage, AvatarFallback }