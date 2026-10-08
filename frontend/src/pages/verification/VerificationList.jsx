import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { CheckCircle2, Clock, XCircle, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

const STATUS_COLORS = {
  assigned: 'secondary', in_progress: 'info', completed: 'success',
  overdue: 'destructive', cancelled: 'secondary',
}

export default function VerificationList() {
  const { user } = useAuth()
  const [status, setStatus] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['verifications', status],
    queryFn: async () => {
      const params = {}
      if (status) params.status = status
      const res = await api.get('/verification', { params })
      return res.data
    },
  })

  const verifications = data?.verifications || []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Verifications</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span className="text-sm text-gray-500">Assigned</span></div>
            <div className="text-2xl font-bold">{verifications.filter(v => v.status === 'assigned').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /><span className="text-sm text-gray-500">In Progress</span></div>
            <div className="text-2xl font-bold">{verifications.filter(v => v.status === 'in_progress').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-sm text-gray-500">Completed</span></div>
            <div className="text-2xl font-bold">{verifications.filter(v => v.status === 'completed').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /><span className="text-sm text-gray-500">Failed</span></div>
            <div className="text-2xl font-bold">{verifications.filter(v => v.status === 'failed').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Records</CardTitle>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-3 border rounded-md text-sm bg-white">
              <option value="">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : verifications.length ? (
              verifications.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.verification_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{v.first_name} {v.last_name}</div>
                      <div className="text-xs text-gray-500">{v.application_number}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{v.verification_type?.replace('_', ' ')}</TableCell>
                  <TableCell>{v.verified_by_name || '—'}</TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[v.status]}>{v.status?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{formatDate(v.scheduled_date)}</TableCell>
                  <TableCell>
                    <Link to={`/applications/${v.application_id}`}>
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No verifications found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
