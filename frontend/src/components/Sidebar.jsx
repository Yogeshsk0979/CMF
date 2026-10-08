import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/utils'
import {
  LayoutDashboard, FileText, DollarSign, Landmark, Wallet, CreditCard,
  ClipboardList, MapPin, MessageSquare, Mail, Users, Settings,
  LogOut, ChevronLeft, ChevronRight, Menu, User
} from 'lucide-react'
import { useState } from 'react'

const NAV_GROUPS = [
  { label: 'Main', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent', 'lender', 'support'] },
  ]},
  { label: 'Loan Management', items: [
    {
      to: '/applications',
      icon: FileText,
      label: 'Applications',
      roles: ['super_admin', 'branch_admin', 'team_leader', 'field_officer'],
      children: [
        { to: '/applications', label: 'All Applications' },
        { to: '/applications/new', label: 'New Application' },
        { to: '/applications?status=submitted', label: 'Verification Queue' },
        { to: '/applications?status=query_raised', label: 'Queries Raised' },
        { to: '/applications?status=approved', label: 'Approved Applications' },
      ]
    },
    { to: '/loans', icon: DollarSign, label: 'Loans', roles: ['super_admin', 'branch_admin', 'team_leader', 'field_officer', 'collection_agent'] },
    { to: '/disbursements', icon: Landmark, label: 'Disbursements', roles: ['super_admin', 'branch_admin'] },
  ]},
  { label: 'Collections', items: [
    { to: '/emi/collection', icon: CreditCard, label: 'EMI Collection', roles: ['field_officer', 'collection_agent', 'team_leader', 'branch_admin', 'super_admin'] },
    { to: '/emi/overdues', icon: Wallet, label: 'Overdues', roles: ['team_leader', 'branch_admin', 'super_admin'] },
    { to: '/emi/dues', icon: ClipboardList, label: 'Customer Dues', roles: ['field_officer', 'collection_agent', 'team_leader'] },
  ]},
  { label: 'Operations', items: [
    { to: '/tasks', icon: ClipboardList, label: 'Tasks', roles: ['field_officer', 'collection_agent', 'team_leader', 'branch_admin', 'super_admin'] },
    { to: '/verification/field-visit', icon: MapPin, label: 'Field Visit', roles: ['field_officer', 'collection_agent'] },
    { to: '/areas', icon: MapPin, label: 'Areas', roles: ['super_admin', 'branch_admin', 'team_leader'] },
  ]},
  { label: 'Accounting', items: [
    { to: '/ledger/accounts', icon: Landmark, label: 'Ledger', roles: ['super_admin', 'branch_admin'] },
    { to: '/ledger/trial-balance', icon: Landmark, label: 'Trial Balance', roles: ['super_admin', 'branch_admin'] },
  ]},
  { label: 'Communication', items: [
    { to: '/communication/sms', icon: MessageSquare, label: 'SMS', roles: ['super_admin', 'branch_admin', 'team_leader', 'field_officer'] },
    { to: '/communication/email', icon: Mail, label: 'Email', roles: ['super_admin', 'branch_admin', 'team_leader', 'field_officer'] },
  ]},
  { label: 'System', items: [
    { to: '/settings/users', icon: Users, label: 'Users', roles: ['super_admin', 'branch_admin'] },
    { to: '/settings/products', icon: Settings, label: 'Products', roles: ['super_admin', 'branch_admin'] },
  ]},
]

const ROLE_DISPLAY = {
  super_admin: 'Super Admin',
  branch_admin: 'Branch Admin',
  team_leader: 'Team Leader',
  field_officer: 'Field Officer',
  collection_agent: 'Collection Agent',
  customer: 'Customer',
  lender: 'Lender',
  support: 'Support',
}

export default function Sidebar() {
  const { user, logout, hasRole } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const currentFullUrl = location.pathname + location.search

  const isUrlActive = (targetUrl) => {
    if (targetUrl.includes('?')) {
      return currentFullUrl === targetUrl
    }
    if (targetUrl === '/applications') {
      return location.pathname === '/applications' && (!location.search || location.search === '')
    }
    return location.pathname === targetUrl
  }

  const handleLogout = () => {
    logout()
  }

  const initials = (user?.profile?.first_name?.[0] || '') + (user?.profile?.last_name?.[0] || '')

  return (
    <aside className={cn("flex flex-col h-screen bg-slate-900 text-white transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CMF</span>
            </div>
            <div>
              <div className="font-semibold text-sm">Continumm</div>
              <div className="text-xs text-slate-400">Microfinance</div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-700 rounded">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(item => hasRole(...item.roles))
          if (items.length === 0) return null
          return (
            <div key={group.label}>
              {!collapsed && <div className="px-2 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider">{group.label}</div>}
              {items.map((item) => {
                const isParentActive = location.pathname.startsWith(item.to)
                return (
                  <div key={item.to + item.label} className="space-y-1 mb-1">
                    <NavLink
                      to={item.to}
                      end={item.children ? true : false}
                      className={() =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          isParentActive && !item.children
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="font-semibold text-xs">{item.label}</span>}
                    </NavLink>
                    {!collapsed && item.children && (
                      <div className="ml-5 space-y-1 border-l-2 border-slate-700/80 pl-2">
                        {item.children.map((child) => {
                          const active = isUrlActive(child.to)
                          return (
                            <NavLink
                              key={child.to + child.label}
                              to={child.to}
                              className={() =>
                                cn(
                                  "block px-2.5 py-1.5 rounded-md text-xs transition-colors",
                                  active
                                    ? "bg-blue-600 text-white font-bold shadow-2xs"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                )
                              }
                            >
                              {child.label}
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && (
          <div className="mb-2 px-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
                {initials || <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user?.profile?.first_name || user?.email}</div>
                <div className="text-xs text-slate-400">{ROLE_DISPLAY[user?.role] || user?.role}</div>
              </div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md w-full">
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}