import { useQuery, useMutation } from '@tanstack/react-query'
import { api, formatDate, formatDateTime } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../components/ui/table'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/button'

export default function NotificationPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const params = {}
      if (filter !== 'all') params.unread_only = filter === 'unread'
      const res = await api.get('/notifications', { params })
      return res.data
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id) => (await api.put(`/notifications/${id}/read`)).data,
    onSuccess: () => refetch(),
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => (await api.post('/notifications/mark-all-read')).data,
    onSuccess: () => refetch(),
  })

  const notifications = data?.notifications || []
  const unreadCount = notifications.filter(n => !n.is_read).length

  const typeColors = {
    info: 'info',
    warning: 'warning',
    success: 'success',
    error: 'destructive',
    reminder: 'secondary',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">{unreadCount} unread notifications</p>
        </div>
        <div className="flex gap-2">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-md border ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Read'}
            </button>
          ))}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()}>
              <CheckCheck className="w-4 h-4 mr-2" />Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : notifications.length ? (
              notifications.map((n) => (
                <TableRow key={n.id} className={!n.is_read ? 'bg-blue-50/50' : ''}>
                  <TableCell>
                    {!n.is_read ? <Bell className="w-4 h-4 text-blue-600" /> : <Check className="w-4 h-4 text-gray-400" />}
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeColors[n.notification_type] || 'secondary'}>{n.notification_type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-md">{n.message}</TableCell>
                  <TableCell className="text-sm text-gray-500">{n.reference_type || '—'}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(n.created_at)}</TableCell>
                  <TableCell>
                    {!n.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(n.id)}>
                        <CheckCheck className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No notifications</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
