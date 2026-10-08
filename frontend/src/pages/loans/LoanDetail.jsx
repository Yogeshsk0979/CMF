import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { ArrowLeft, Download, Printer } from 'lucide-react'

export default function LoanDetail() {
  const { id } = useParams()

  const { data: loan, isLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: async () => (await api.get(`/loans/${id}`)).data,
  })

  const { data: schedule } = useQuery({
    queryKey: ['loan-schedule', id],
    queryFn: async () => (await api.get(`/loans/${id}/schedule`)).data,
  })

  if (isLoading) return <div className="text-center py-8 text-gray-400">Loading loan...</div>
  if (!loan) return <div className="text-center py-8 text-gray-400">Loan not found</div>

  const totalPaid = parseFloat(loan.principal_paid || 0) + parseFloat(loan.interest_paid || 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to="/loans"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{loan.loan_number}</h1>
            <p className="text-gray-500">{loan.first_name} {loan.last_name} &bull; {loan.customer_code} &bull; {loan.branch_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Receipt</Button>
          <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" />Statement</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Loan Amount</div><div className="text-xl font-bold">{formatCurrency(loan.loan_amount)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">EMI</div><div className="text-xl font-bold">{formatCurrency(loan.emi_amount)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Outstanding</div><div className="text-xl font-bold text-amber-600">{formatCurrency(loan.outstanding_principal)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Paid</div><div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><span className="text-sm text-gray-500">Product</span><div className="font-medium">{loan.product_name}</div></div>
            <div><span className="text-sm text-gray-500">Tenure</span><div className="font-medium">{loan.tenure_months} months</div></div>
            <div><span className="text-sm text-gray-500">Interest Rate</span><div className="font-medium">{loan.interest_rate}%</div></div>
            <div><span className="text-sm text-gray-500">Interest Type</span><div className="font-medium capitalize">{loan.interest_type}</div></div>
            <div><span className="text-sm text-gray-500">Total Interest</span><div className="font-medium">{formatCurrency(loan.total_interest)}</div></div>
            <div><span className="text-sm text-gray-500">Total Payable</span><div className="font-medium">{formatCurrency(loan.total_payable)}</div></div>
            <div><span className="text-sm text-gray-500">EMI Paid</span><div className="font-medium">{loan.emi_paid_count} / {loan.total_emis}</div></div>
            <div><span className="text-sm text-gray-500">Status</span><div className="font-medium capitalize">{loan.status}</div></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>EMI Schedule</CardTitle>
          <Link to={`/loans/${id}/schedule`}><Button variant="outline" size="sm">View Full Schedule</Button></Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>EMI</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule?.slice(0, 10)?.map((emi) => (
                <TableRow key={emi.id}>
                  <TableCell>{emi.emi_number}</TableCell>
                  <TableCell>{formatDate(emi.due_date)}</TableCell>
                  <TableCell>{formatCurrency(emi.emi_amount)}</TableCell>
                  <TableCell>{formatCurrency(emi.principal)}</TableCell>
                  <TableCell>{formatCurrency(emi.interest)}</TableCell>
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
              ))}
            </TableBody>
          </Table>
          {schedule?.length > 10 && <div className="text-center py-2 text-sm text-gray-500">Showing 10 of {schedule.length} EMIs</div>}
        </CardContent>
      </Card>
    </div>
  )
}
