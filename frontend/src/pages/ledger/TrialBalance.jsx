import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Download, RefreshCw } from 'lucide-react'

export default function TrialBalance() {
  const { data: tb, isLoading, refetch } = useQuery({
    queryKey: ['trial-balance'],
    queryFn: async () => (await api.get('/ledger/trial-balance')).data,
  })

  const accounts = Array.isArray(tb) ? tb : tb?.accounts || []
  const summary = tb?.summary || {}
  const totalDebit = summary.total_debit ?? (accounts.reduce((s, a) => s + parseFloat(a.debit_balance || a.current_balance || 0), 0))
  const totalCredit = summary.total_credit ?? (accounts.reduce((s, a) => s + parseFloat(a.credit_balance || 0), 0))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit Balance</TableHead>
              <TableHead className="text-right">Credit Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : accounts.length ? (
              accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono">{a.account_code}</TableCell>
                  <TableCell>{a.account_name}</TableCell>
                  <TableCell className="capitalize">{a.account_group}</TableCell>
                  <TableCell className="capitalize">{a.account_type}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(a.debit_balance || (parseFloat(a.current_balance || 0) >= 0 ? a.current_balance : 0))}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(a.credit_balance || (parseFloat(a.current_balance || 0) < 0 ? Math.abs(a.current_balance) : 0))}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No accounts found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {accounts.length > 0 && (
          <div className="p-4 border-t bg-gray-50 flex justify-between font-bold text-sm">
            <div>Total Debit: <span className="text-green-700 ml-1">{formatCurrency(totalDebit)}</span></div>
            <div>Total Credit: <span className="text-red-700 ml-1">{formatCurrency(totalCredit)}</span></div>
          </div>
        )}
      </Card>
    </div>
  )
}