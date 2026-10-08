import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Plus, Eye, Search, Edit } from 'lucide-react'
import { useState, useEffect } from 'react'

const STATUS_COLORS = {
  draft: 'secondary',
  submitted: 'info',
  in_review: 'warning',
  query_raised: 'destructive',
  approved: 'success',
  rejected: 'destructive',
  disbursed: 'success',
  completed: 'success',
  cancelled: 'secondary',
  expired: 'destructive',
}

export default function ApplicationList() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const urlStatus = searchParams.get('status') || ''
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(urlStatus)

  useEffect(() => {
    setStatus(urlStatus)
  }, [urlStatus])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['applications', search, status],
    queryFn: async () => {
      const params = {}
      if (search) params.search = search
      if (status) params.status = status
      const res = await api.get('/applications', { params })
      return res.data
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <Link to="/applications/new">
          <Button><Plus className="w-4 h-4 mr-2" />New Application</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, application #..."
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 border rounded-md text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="in_review">In Review</option>
          <option value="query_raised">Query Raised</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="disbursed">Disbursed</option>
        </select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : data?.applications?.length ? (
              data.applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.application_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{app.first_name} {app.last_name}</div>
                      <div className="text-xs text-gray-500">{app.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{app.product_name}</TableCell>
                  <TableCell>{formatCurrency(app.loan_amount)}</TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[app.status] || 'secondary'}>{app.status?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{formatDate(app.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Link to={`/applications/${app.id}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs border-slate-300">
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-600" /> View
                        </Button>
                      </Link>
                      {['draft', 'submitted', 'in_review', 'query_raised'].includes(app.status) && (
                        <Link to={`/applications/${app.id}/edit`}>
                          <Button variant="default" size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No applications found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}