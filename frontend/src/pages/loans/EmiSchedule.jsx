import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../components/ui/table'
import { ArrowLeft, Download } from 'lucide-react'

const STATUS_COLORS = {
  pending: 'warning', paid: 'success', overdue: 'destructive',
  bounced: 'destructive', waived: 'secondary',
}

export default function EmiSchedule() {
  const { id } = useParams()

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['emi-schedule', id],
    queryFn: async () => (await api.get(`/loans/${id}/schedule`)).data,
  })

  const { data: loan } = useQuery({
    queryKey: ['loan-basic', id],
    queryFn: async () => (await api.get(`/loans/${id}`)).data,
  })

  if (isLoading) return <div className="text-center py-8 text-gray-400">Loading schedule...</div>

  const totalEmi = schedule?.reduce((s, e) => s + parseFloat(e.emi_amount || 0), 0) || 0
  const totalPrincipal = schedule?.reduce((s, e) => s + parseFloat(e.principal || 0), 0) || 0
  const totalInterest = schedule?.reduce((s, e) => s + parseFloat(e.interest || 0), 0) || 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to={`/loans/${id}`}><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <h1 className="text-2xl font-bold text-gray-900">EMI Schedule</h1>
          </div>
          {loan && <p className="text-gray-500 mt-1">{loan.loan_number} • {loan.first_name} {loan.last_name}</p>}
        </div>
        <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Download</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Total EMI</div><div className="text-xl font-bold">{formatCurrency(totalEmi)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Principal</div><div className="text-xl font-bold">{formatCurrency(totalPrincipal)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Interest</div><div className="text-xl font-bold">{formatCurrency(totalInterest)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">EMIs</div><div className="text-xl font-bold">{schedule?.length || 0}</div></CardContent></Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>EMI Amount</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule?.length ? (
              schedule.map((emi) => (
                <TableRow key={emi.id}>
                  <TableCell className="font-medium">#{emi.emi_number}</TableCell>
                  <TableCell>{formatDate(emi.due_date)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(emi.emi_amount)}</TableCell>
                  <TableCell>{formatCurrency(emi.principal)}</TableCell>
                  <TableCell>{formatCurrency(emi.interest)}</TableCell>
                  <TableCell>{formatCurrency(emi.balance)}</TableCell>
                  <TableCell>
                    {emi.is_paid ? (
                      <Badge variant="success">Paid {formatDate(emi.paid_on)}</Badge>
                    ) : emi.is_overdue ? (
                      <Badge variant="destructive">Overdue ({emi.days_overdue}d)</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No schedule found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
