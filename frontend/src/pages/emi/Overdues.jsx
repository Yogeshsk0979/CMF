import { useQuery, useMutation } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { Phone, MessageSquare, AlertTriangle, DollarSign } from 'lucide-react'
import { useState } from 'react'

export default function Overdues() {
  const [markPaidId, setMarkPaidId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const { data: overdues, isLoading } = useQuery({
    queryKey: ['overdues'],
    queryFn: async () => (await api.get('/emi/overdues')).data,
  })

  const markPaidMutation = useMutation({
    mutationFn: async ({ emiId, method }) => (await api.post(`/emi/${emiId}/mark-paid`, { payment_method: method })).data,
    onSuccess: () => { setMarkPaidId(null); setPaymentMethod('cash') },
  })

  const remindMutation = useMutation({
    mutationFn: async (emiId) => (await api.post(`/emi/${emiId}/send-reminder`)).data,
  })

  const buckets = overdues?.reduce((acc, o) => {
    const days = o.days_overdue
    if (days <= 7) acc['1-7'] = (acc['1-7'] || 0) + parseFloat(o.emi_amount)
    else if (days <= 15) acc['8-15'] = (acc['8-15'] || 0) + parseFloat(o.emi_amount)
    else if (days <= 30) acc['16-30'] = (acc['16-30'] || 0) + parseFloat(o.emi_amount)
    else acc['30+'] = (acc['30+'] || 0) + parseFloat(o.emi_amount)
    return acc
  }, {}) || {}

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Overdue EMIs</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">1-7 days</div>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(buckets['1-7'] || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">8-15 days</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(buckets['8-15'] || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">16-30 days</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(buckets['16-30'] || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">30+ days (NPA Risk)</div>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(buckets['30+'] || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Overdue Accounts ({overdues?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Loan #</TableHead>
                <TableHead>EMI #</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">Loading...</TableCell>
                </TableRow>
              ) : overdues?.length ? (
                overdues.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.first_name} {o.last_name}</div>
                      <div className="text-xs text-gray-500">{o.email}</div>
                    </TableCell>
                    <TableCell className="font-medium">{o.loan_number}</TableCell>
                    <TableCell>#{o.emi_number}</TableCell>
                    <TableCell>{formatDate(o.due_date)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{o.days_overdue} days</Badge>
                    </TableCell>
                    <TableCell className="font-bold">{formatCurrency(o.emi_amount)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Call">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="SMS">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-col">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remindMutation.mutate(o.id)}
                          disabled={remindMutation.isPending}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Remind
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setMarkPaidId(o.id)}
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Mark Paid
                        </Button>
                      </div>
                      {markPaidId === o.id && (
                        <div className="flex gap-1 mt-1">
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="text-xs border rounded px-1 h-7"
                          >
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank</option>
                            <option value="card">Card</option>
                          </select>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => markPaidMutation.mutate({ emiId: o.id, method: paymentMethod })}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setMarkPaidId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">No overdue EMIs</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
