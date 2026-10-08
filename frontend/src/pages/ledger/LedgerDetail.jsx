import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function LedgerDetail() {
  const { accountId } = useParams()

  const { data: account } = useQuery({
    queryKey: ['ledger-account', accountId],
    queryFn: async () => (await api.get(`/ledger/accounts/${accountId}`)).data,
  })

  const { data: entries } = useQuery({
    queryKey: ['ledger-entries', accountId],
    queryFn: async () => (await api.get(`/ledger/accounts/${accountId}/entries`)).data,
    enabled: !!accountId,
  })

  if (!account) return <div className="text-center py-8 text-gray-400">Loading account...</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/ledger"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{account.account_name}</h1>
              <p className="text-gray-500">{account.account_code} • <span className="capitalize">{account.account_type}</span></p>
            </div>
          </div>
        </div>
        <Badge variant={parseFloat(account.current_balance) >= 0 ? 'success' : 'destructive'}>
          {formatCurrency(account.current_balance)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Account Group</div><div className="text-lg font-bold capitalize">{account.account_group}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Opening Balance</div><div className="text-lg font-bold">{formatCurrency(account.opening_balance)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Current Balance</div><div className="text-lg font-bold">{formatCurrency(account.current_balance)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries?.length ? (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.transaction_date)}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="font-mono text-sm">{entry.reference || '—'}</TableCell>
                  <TableCell>{entry.debit ? formatCurrency(entry.debit) : '—'}</TableCell>
                  <TableCell>{entry.credit ? formatCurrency(entry.credit) : '—'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(entry.balance)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No transactions found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
