import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }