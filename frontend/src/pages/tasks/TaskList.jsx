import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Eye, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

const PRIORITY_COLORS = { low: 'info', medium: 'secondary', high: 'warning', urgent: 'destructive' }

function StatTile({ label, icon: IconComponent, count, color }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <IconComponent className={`w-4 h-4 ${color}`} />
          <span className="text-sm text-gray-500">{label}</span>
          <div className="ml-auto font-bold">{count}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TaskList() {
  const { user } = useAuth()
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/tasks')).data,
  })

  const allTasks = tasks || []
  const stats = {
    assigned: allTasks.filter(t => t.status === 'assigned').length,
    in_progress: allTasks.filter(t => t.status === 'in_progress').length,
    completed: allTasks.filter(t => t.status === 'completed').length,
    overdue: allTasks.filter(t => t.status === 'overdue').length,
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatTile label="Assigned" icon={Clock} count={stats.assigned} color="text-blue-500" />
        <StatTile label="In Progress" icon={Clock} count={stats.in_progress} color="text-amber-500" />
        <StatTile label="Completed" icon={CheckCircle2} count={stats.completed} color="text-green-500" />
        <StatTile label="Overdue" icon={AlertTriangle} count={stats.overdue} color="text-red-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
              ) : allTasks.length ? (
                allTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.task_number}</TableCell>
                    <TableCell className="capitalize">{t.task_type?.replace('_', ' ')}</TableCell>
                    <TableCell>{t.first_name || t.application_number}</TableCell>
                    <TableCell><Badge variant={PRIORITY_COLORS[t.priority]}>{t.priority}</Badge></TableCell>
                    <TableCell className="capitalize">{t.status}</TableCell>
                    <TableCell>{formatDate(t.scheduled_date)}</TableCell>
                    <TableCell>
                      {t.application_id && (
                        <Link to={`/applications/${t.application_id}`}>
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No tasks found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}