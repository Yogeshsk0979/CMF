import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Landmark, ArrowLeft } from 'lucide-react'

export default function DisbursementForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { loanId } = useParams()
  const [bankAccountId, setBankAccountId] = useState('')
  const [mode, setMode] = useState('bank_transfer')
  const [utr, setUtr] = useState('')
  const [chargesData, setChargesData] = useState({ totalCharges: 0, netAmount: 0 })

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ['loan-for-disburse', loanId],
    queryFn: async () => (await api.get(`/loans/${loanId}`)).data,
    enabled: !!loanId,
  })

  const { data: bankAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => (await api.get('/ledger/bank-accounts')).data,
  })

  const { data: charges } = useQuery({
    queryKey: ['disburse-charges', loanId],
    queryFn: async () => (await api.post('/disbursements/calculate-charges', {
      loan_amount: loan?.loan_amount || 0,
      product_id: loan?.product_id,
    })).data,
    enabled: !!loan?.loan_amount && !!loan?.product_id,
  })

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/disbursements', {
      loan_id: loanId,
      bank_account_id: bankAccountId,
      disbursement_mode: mode,
      utr_number: utr,
      total_charges: charges?.charges?.reduce((s, c) => s + parseFloat(c.total_amount || 0), 0) || 0,
      net_disbursement_amount: charges?.netAmount || loan?.loan_amount || 0,
      processed_by: user.id,
      status: 'completed',
      created_by: user.id,
    })).data,
    onSuccess: () => {
      toast.success('Disbursement processed successfully')
      navigate('/disbursements')
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Disbursement failed')
    },
  })

  const isLoading = loanLoading || accountsLoading

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>
  }

  const netAmount = charges?.netAmount || loan?.loan_amount || 0
  const totalCharges = charges?.charges?.reduce((s, c) => s + parseFloat(c.total_amount || 0), 0) || 0

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link to="/disbursements"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="text-2xl font-bold text-gray-900">New Disbursement</h1>
      </div>

      {loan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><span className="text-xs text-blue-700">Loan</span><div className="font-medium">{loan.loan_number}</div></div>
              <div><span className="text-xs text-blue-700">Customer</span><div className="font-medium">{loan.first_name} {loan.last_name}</div></div>
              <div><span className="text-xs text-blue-700">Loan Amount</span><div className="font-bold text-lg">{formatCurrency(loan.loan_amount)}</div></div>
              <div><span className="text-xs text-blue-700">Product</span><div className="font-medium">{loan.product_name}</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div><Label>Bank Account</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts?.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.bank_name} &mdash; {b.account_number?.slice(-4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Disbursement Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="imps">IMPS</SelectItem>
                <SelectItem value="neft">NEFT</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>UTR / Reference Number</Label><Input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter UTR number (if applicable)" /></div>
          {charges?.charges?.length > 0 && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-amber-900 mb-2">Charges Breakdown</div>
              {charges.charges.map((c, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{c.charge_head}</span>
                  <span>{formatCurrency(c.total_amount)}</span>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 flex justify-between font-bold text-amber-900">
                <span>Total Charges</span>
                <span>{formatCurrency(totalCharges)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-900 mt-1">
                <span>Net Disbursement</span>
                <span>{formatCurrency(netAmount)}</span>
              </div>
            </div>
          )}
          <Button onClick={() => createMutation.mutate()} className="w-full" disabled={!bankAccountId || createMutation.isPending}>
            <Landmark className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Processing...' : 'Process Disbursement'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
