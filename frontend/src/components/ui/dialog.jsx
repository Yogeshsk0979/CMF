import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const DialogContext = React.createContext(null)

function Dialog({ children, open, onOpenChange }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogContent({ children, className, title, description }) {
  const { open, onOpenChange } = React.useContext(DialogContext)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className={cn("relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg", className)} onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
        {title && <div className="p-6 pb-2"><h2 className="text-lg font-semibold">{title}</h2>{description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}</div>}
        <div className="p-6 pt-2">{children}</div>
      </div>
    </div>
  )
}

function DialogTrigger({ children, asChild, ...props }) {
  const { onOpenChange } = React.useContext(DialogContext)
  if (asChild) return React.cloneElement(children, { onClick: () => onOpenChange(true) })
  return <button onClick={() => onOpenChange(true)} {...props}>{children}</button>
}

function DialogClose({ children, asChild, ...props }) {
  const { onOpenChange } = React.useContext(DialogContext)
  if (asChild) return React.cloneElement(children, { onClick: () => onOpenChange(false) })
  return <button onClick={() => onOpenChange(false)} {...props}>{children}</button>
}

export { Dialog, DialogContent, DialogTrigger, DialogClose }