import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

export default function LedgerAccounts() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['ledger-accounts'],
    queryFn: async () => (await api.get('/ledger/accounts')).data,
  })

  const groups = accounts?.reduce((acc, a) => { acc[a.account_group] = acc[a.account_group] || []; acc[a.account_group].push(a); return acc }, {}) || {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ledger Accounts</h1>

      {Object.entries(groups).map(([group, accounts]) => (
        <Card key={group}>
          <CardHeader><CardTitle className="capitalize">{group} ({accounts.length})</CardTitle></CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Current Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono">{a.account_code}</TableCell>
                  <TableCell>{a.account_name}</TableCell>
                  <TableCell className="capitalize">{a.account_type}</TableCell>
                  <TableCell>{formatCurrency(a.opening_balance)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(a.current_balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  )
}