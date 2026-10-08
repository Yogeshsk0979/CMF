import { useState } from 'react'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { DollarSign, CreditCard, CheckCircle2, Download, FileText } from 'lucide-react'

export default function PayEmi() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [selectedLoan, setSelectedLoan] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [success, setSuccess] = useState(false)

  const { data: loansData } = useQuery({
    queryKey: ['customer-loans', user.id],
    queryFn: async () => (await api.get(`/loans?customer_id=${user.id}`)).data,
  })

  const { data: dues } = useQuery({
    queryKey: ['customer-dues', user.id],
    queryFn: async () => (await api.get(`/emi/customer/${user.id}/dues`)).data,
  })

  const activeLoans = loansData?.loans?.filter(l => ['active', 'disbursed'].includes(l.status)) || []

  const selectedDue = dues?.find(d => d.loan_id === parseInt(selectedLoan)) || dues?.find(d => !d.is_paid)
  const pendingDues = dues?.filter(d => !d.is_paid) || []
  const totalDue = pendingDues.reduce((s, d) => s + parseFloat(d.emi_amount || 0), 0)

  const payMutation = useMutation({
    mutationFn: async () => (await api.post('/emi/pay', {
      loan_id: parseInt(selectedLoan),
      payment_amount: parseFloat(amount),
      payment_method: method,
      payment_date: new Date().toISOString().split('T')[0],
      received_by: user.id,
      customer_id: user.id,
    })).data,
    onSuccess: () => {
      setSuccess(true)
      setSelectedLoan('')
      setAmount('')
      setMethod('cash')
      queryClient.invalidateQueries({ queryKey: ['customer-dues', user.id] })
      queryClient.invalidateQueries({ queryKey: ['customer-loans', user.id] })
      setTimeout(() => setSuccess(false), 4000)
    },
    onError: (err) => {
      console.error('Payment failed:', err)
    },
  })

  const handlePay = () => {
    if (!selectedLoan || !amount) return
    payMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pay EMI</h1>

      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Payment Recorded Successfully!</p>
              <p className="text-sm text-green-700">Your payment of {formatCurrency(amount)} has been recorded.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Active Loans</div>
            <div className="text-3xl font-bold mt-2">{activeLoans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Pending EMIs</div>
            <div className="text-3xl font-bold text-amber-600 mt-2">{pendingDues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-500">Total Due</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalDue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Make a Payment</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Select Loan</Label>
              <Select value={selectedLoan} onValueChange={(v) => { setSelectedLoan(v); setAmount('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a loan" />
                </SelectTrigger>
                <SelectContent>
                  {activeLoans.map((loan) => (
                    <SelectItem key={loan.id} value={String(loan.id)}>
                      {loan.loan_number} - {formatCurrency(loan.emi_amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={selectedDue ? String(selectedDue.emi_amount) : 'Enter amount'}
              />
              {selectedDue && (
                <p className="text-xs text-gray-500 mt-1">EMI due: {formatCurrency(selectedDue.emi_amount)}</p>
              )}
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              className="w-full md:w-auto"
              onClick={handlePay}
              disabled={!selectedLoan || !amount || parseFloat(amount) <= 0 || payMutation.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {payMutation.isPending ? 'Processing...' : 'Record Payment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Loan #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingDues.length > 0 ? (
                pendingDues.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{formatDate(d.due_date)}</TableCell>
                    <TableCell className="font-medium">{d.loan_number}</TableCell>
                    <TableCell>{formatCurrency(d.emi_amount)}</TableCell>
                    <TableCell className="capitalize">—</TableCell>
                    <TableCell>
                      <Badge variant={d.is_overdue ? 'destructive' : 'warning'}>
                        {d.is_overdue ? 'Overdue' : 'Due'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    No pending payments
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
