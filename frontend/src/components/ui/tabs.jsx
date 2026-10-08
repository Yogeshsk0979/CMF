import * as React from "react"
import { cn } from "@/lib/utils"

const TabsContext = React.createContext(null)

function Tabs({ children, defaultValue, value, onValueChange, ...props }) {
  const [internal, setInternal] = React.useState(defaultValue || '')
  const current = value !== undefined ? value : internal
  const setValue = (v) => {
    if (value === undefined) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ children, className }) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-start rounded-md bg-gray-100 p-1 text-gray-500", className)}>
      {children}
    </div>
  )
}

function TabsTrigger({ children, value, className }) {
  const ctx = React.useContext(TabsContext)
  const active = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
        className
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ children, value, className }) {
  const ctx = React.useContext(TabsContext)
  if (ctx.value !== value) return null
  return <div className={cn("mt-4 ring-offset-background", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }