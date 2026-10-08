import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Link } from 'react-router-dom'
import { Landmark, TrendingUp, AlertCircle } from 'lucide-react'

export default function LedgerPage() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['ledger-accounts'],
    queryFn: async () => (await api.get('/ledger/accounts')).data,
  })

  const groups = accounts?.reduce((acc, a) => {
    acc[a.account_group] = acc[a.account_group] || []
    acc[a.account_group].push(a)
    return acc
  }, {}) || {}

  const totalAssets = groups?.assets?.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0) || 0
  const totalLiabilities = groups?.liabilities?.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0) || 0
  const totalIncome = groups?.income?.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0) || 0
  const totalExpenses = groups?.expenses?.reduce((s, a) => s + parseFloat(a.current_balance || 0), 0) || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ledger</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><Landmark className="w-4 h-4 text-blue-600" /><span className="text-sm text-gray-500">Assets</span></div>
            <div className="text-xl font-bold mt-1">{formatCurrency(totalAssets)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-red-600" /><span className="text-sm text-gray-500">Liabilities</span></div>
            <div className="text-xl font-bold mt-1">{formatCurrency(totalLiabilities)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /><span className="text-sm text-gray-500">Income</span></div>
            <div className="text-xl font-bold mt-1">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600" /><span className="text-sm text-gray-500">Expenses</span></div>
            <div className="text-xl font-bold mt-1">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      {Object.entries(groups).map(([group, accts]) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="capitalize">{group} ({accts.length})</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead>Current Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accts.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-sm">{a.account_code}</TableCell>
                  <TableCell className="font-medium">{a.account_name}</TableCell>
                  <TableCell className="capitalize text-sm">{a.account_type}</TableCell>
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
