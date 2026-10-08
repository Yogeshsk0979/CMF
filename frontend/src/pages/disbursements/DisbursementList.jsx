import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

const STATUS_COLORS = { pending: 'secondary', approved: 'info', processing: 'warning', completed: 'success', failed: 'destructive', reversed: 'destructive', cancelled: 'secondary' }

export default function DisbursementList() {
  const { data, isLoading } = useQuery({
    queryKey: ['disbursements'],
    queryFn: async () => (await api.get('/disbursements')).data,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Disbursements</h1>
        <Link to="/disbursements/new"><Button>New Disbursement</Button></Link>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Loan #</TableHead>
              <TableHead>Loan Amount</TableHead>
              <TableHead>Charges</TableHead>
              <TableHead>Net Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : data?.disbursements?.length ? (
              data.disbursements.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.disbursement_number}</TableCell>
                  <TableCell>{d.email || d.customer_id?.slice(0, 8)}</TableCell>
                  <TableCell>{d.loan_number}</TableCell>
                  <TableCell>{formatCurrency(d.loan_amount)}</TableCell>
                  <TableCell>{formatCurrency(d.total_charges)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(d.net_disbursement_amount)}</TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[d.status] || 'secondary'}>{d.status}</Badge></TableCell>
                  <TableCell>{formatDate(d.disbursement_date)}</TableCell>
                  <TableCell><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-400">No disbursements</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}