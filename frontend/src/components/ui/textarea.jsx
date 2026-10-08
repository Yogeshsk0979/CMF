import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
      className
    )}
    {...props}
  />
))
Textarea.displayName = "Textarea"

export { Textarea }