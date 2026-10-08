import { Bell, Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

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

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="flex items-center justify-between h-16 bg-white border-b px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">CMF Portal</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 text-sm border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="text-sm">
          <span className="text-gray-600">{ROLE_DISPLAY[user?.role] || user?.role}</span>
        </div>
      </div>
    </header>
  )
}