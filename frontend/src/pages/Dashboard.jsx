import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Users, DollarSign, Clock, AlertCircle, TrendingUp, FileText, Landmark, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function StatCard({ title, value, icon: Icon, color, change }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {change != null && <p className="text-xs text-gray-500 mt-1">{change}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => (await api.get('/dashboard/stats')).data,
  })

  const { data: overduesData } = useQuery({
    queryKey: ['overdue-summary'],
    queryFn: async () => (await api.get('/dashboard/collection')).data,
    enabled: ['team_leader', 'branch_admin', 'super_admin'].includes(user?.role),
  })

  const { data: applications } = useQuery({
    queryKey: ['recent-applications'],
    queryFn: async () => (await api.get('/applications?limit=5')).data,
  })

  const role = user?.role
  const loans = stats?.loans || {}
  const apps = stats?.applications || {}
  const overdue = stats?.overdue || {}
  const collections = overduesData || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.profile?.first_name || user?.email}</h1>
          <p className="text-gray-500 mt-1">Here's your current overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(loans.total_disbursed)}
          icon={DollarSign}
          color="bg-blue-600"
          change={`${loans.active_loans || 0} active loans`}
        />
        <StatCard
          title="Outstanding"
          value={formatCurrency(loans.total_outstanding)}
          icon={TrendingUp}
          color="bg-amber-600"
        />
        <StatCard
          title="Total Repaid"
          value={formatCurrency(loans.total_repaid)}
          icon={CheckCircle2}
          color="bg-green-600"
        />
        <StatCard
          title="Overdue EMIs"
          value={parseInt(overdue.overdue_emis || 0)}
          icon={AlertCircle}
          color="bg-red-600"
          change={formatCurrency(overdue.overdue_amount)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Latest loan applications in your area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications?.applications?.slice(0, 5).map((app) => (
                <Link key={app.id} to={`/applications/${app.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border">
                  <div>
                    <div className="font-medium text-sm">{app.first_name} {app.last_name}</div>
                    <div className="text-xs text-gray-500">{app.application_number} • {app.product_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(app.loan_amount)}</div>
                    <div className="text-xs text-gray-500 capitalize">{app.status?.replace('_', ' ')}</div>
                  </div>
                </Link>
              ))}
              {!applications?.applications?.length && (
                <div className="text-center text-gray-400 py-8">No applications yet</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Pipeline breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-bold">{apps.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Approved</span>
                </div>
                <span className="font-bold">{apps.approved_today || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Disbursed</span>
                </div>
                <span className="font-bold">{apps.disbursed || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(role === 'super_admin' || role === 'branch_admin') && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Collection</CardTitle>
            <CardDescription>EMI collection this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-xs text-green-700 font-medium">Collected This Month</div>
                <div className="text-2xl font-bold text-green-900 mt-2">{formatCurrency(collections.collected_amount)}</div>
                <div className="text-xs text-green-700 mt-1">{collections.collected_this_month || 0} EMIs</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-xs text-red-700 font-medium">Overdue</div>
                <div className="text-2xl font-bold text-red-900 mt-2">{formatCurrency(collections.overdue_amount)}</div>
                <div className="text-xs text-red-700 mt-1">{collections.overdue_count || 0} customers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}