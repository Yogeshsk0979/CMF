import * as React from "react"
import { ChevronUp, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const SelectContext = React.createContext(null)

function Select({ children, value, onValueChange, ...props }) {
  const [open, setOpen] = React.useState(false)
  const [labelMap, setLabelMap] = React.useState({})
  const ref = React.useRef(null)

  const registerItem = React.useCallback((val, label) => {
    setLabelMap((prev) => {
      if (prev[val] === label) return prev
      return { ...prev, [val]: label }
    })
  }, [])

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, labelMap, registerItem }}>
      <div ref={ref} className="relative w-full" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

function SelectTrigger({ children, className, placeholder }) {
  const { open, setOpen } = React.useContext(SelectContext) || {}
  return (
    <button
      type="button"
      onClick={() => setOpen && setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-2 truncate">
        {children || <SelectValue placeholder={placeholder} />}
      </div>
      {open ? (
        <ChevronUp className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
      ) : (
        <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 ml-2" />
      )}
    </button>
  )
}

function SelectContent({ children, className }) {
  const { open } = React.useContext(SelectContext) || {}
  if (!open) return null
  return (
    <div
      className={cn(
        "absolute top-full left-0 z-50 mt-1 w-full min-w-[12rem] rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
        {children}
      </div>
    </div>
  )
}

function SelectItem({ value, children, className }) {
  const { value: currentValue, onValueChange, setOpen, registerItem } = React.useContext(SelectContext) || {}
  const selected = currentValue === value

  React.useEffect(() => {
    if (registerItem && value !== undefined && children !== undefined) {
      const labelText = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children))
      registerItem(value, labelText)
    }
  }, [registerItem, value, children])

  const handleSelect = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onValueChange) {
      onValueChange(value)
    }
    if (setOpen) {
      setOpen(false)
    }
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-lg py-2 px-2.5 text-xs outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        selected ? "bg-blue-50 font-semibold text-blue-700 hover:bg-blue-100/80" : "text-slate-700 font-medium",
        className
      )}
      onClick={handleSelect}
    >
      <span className="truncate pr-2">{children}</span>
      {selected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
    </div>
  )
}

function SelectValue({ children, placeholder }) {
  const { value, labelMap } = React.useContext(SelectContext) || {}
  const registeredLabel = labelMap?.[value]
  const isUuid = value && typeof value === 'string' && value.includes('-') && value.length > 20

  let displayContent = children || registeredLabel
  if (!displayContent && value) {
    if (isUuid) {
      displayContent = placeholder || "Selected"
    } else {
      displayContent = String(value).replace(/_/g, ' ')
    }
  }

  return (
    <span className={cn("capitalize truncate", !value && !children && "text-slate-400 font-normal")}>
      {displayContent || placeholder}
    </span>
  )
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }