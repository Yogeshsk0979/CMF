import { useQuery, useMutation } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableRow } from '../../components/ui/table'
import { DollarSign, Search } from 'lucide-react'
import { useState } from 'react'

export default function EmiCollection() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const { data: dues } = useQuery({
    queryKey: ['customer-dues', user.id],
    queryFn: async () => (await api.get(`/emi/customer/${user.id}/dues`)).data,
  })

  const [selectedLoan, setSelectedLoan] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')

  const payMutation = useMutation({
    mutationFn: async () => (await api.post('/emi/pay', {
      loan_id: selectedLoan,
      payment_amount: parseFloat(amount),
      payment_method: method,
      payment_date: new Date().toISOString().split('T')[0],
      received_by: user.id,
      customer_id: user.id,
    })).data,
    onSuccess: () => { setSelectedLoan(''); setAmount('') },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">EMI Collection</h1>

      <Card>
        <CardHeader><CardTitle>Collect Payment</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Loan</label>
              <Select value={selectedLoan} onValueChange={setSelectedLoan} placeholder="Choose loan">
                {dues?.map((d) => (
                  <SelectItem key={d.loan_id} value={d.loan_id}>{d.loan_number} • {formatCurrency(d.emi_amount)}</SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => payMutation.mutate()} disabled={!selectedLoan || !amount}>
                <DollarSign className="w-4 h-4 mr-2" />Record Payment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pending Dues</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loan #</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dues?.map((due) => (
                <TableRow key={due.id}>
                  <TableCell className="font-medium">{due.loan_number}</TableCell>
                  <TableCell>{due.product_name}</TableCell>
                  <TableCell>{formatDate(due.due_date)}</TableCell>
                  <TableCell>{formatCurrency(due.emi_amount)}</TableCell>
                  <TableCell>{due.is_overdue ? `${due.days_overdue} days` : '—'}</TableCell>
                  <TableCell>
                    {due.is_overdue ? <Badge variant="destructive">Overdue</Badge> : <Badge variant="warning">Due</Badge>}
                  </TableCell>
                </TableRow>
              ))}
              {!dues?.length && <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No pending dues</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}