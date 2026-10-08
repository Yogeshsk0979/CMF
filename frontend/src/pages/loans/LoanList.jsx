import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { Eye, Search } from 'lucide-react'
import { useState } from 'react'

export default function LoanList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['loans', search, status],
    queryFn: async () => {
      const params = {}
      if (search) params.search = search
      if (status) params.status = status
      const res = await api.get('/loans', { params })
      return res.data
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Loans</h1>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search loans..." className="pl-9" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 px-3 border rounded-md text-sm bg-white">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disbursed">Disbursed</option>
          <option value="closed">Closed</option>
          <option value="npa">NPA</option>
          <option value="foreclosed">Foreclosed</option>
        </select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loan #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>EMI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : data?.loans?.length ? (
              data.loans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-medium">{loan.loan_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{loan.first_name} {loan.last_name}</div>
                      <div className="text-xs text-gray-500">{loan.customer_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>{loan.product_name}</TableCell>
                  <TableCell>{formatCurrency(loan.loan_amount)}</TableCell>
                  <TableCell>{formatCurrency(loan.emi_amount)}</TableCell>
                  <TableCell><span className="capitalize">{loan.status?.replace('_', ' ')}</span></TableCell>
                  <TableCell>
                    <Link to={`/loans/${loan.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">No loans found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}