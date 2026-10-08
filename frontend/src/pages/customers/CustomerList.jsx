import { useQuery } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { Eye, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function CustomerList() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const params = {}
      if (search) params.search = search
      const res = await api.get('/customers', { params })
      return res.data
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link to="/applications/new"><Button><Plus className="w-4 h-4 mr-2" />New Customer</Button></Link>
      </div>

      <div className="relative flex-1 max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pl-9"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Total Loans</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
            ) : data?.customers?.length ? (
              data.customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.customer_code}</TableCell>
                  <TableCell>{customer.first_name} {customer.last_name}</TableCell>
                  <TableCell>{customer.profile?.phone || customer.phone || '—'}</TableCell>
                  <TableCell>{customer.email || '—'}</TableCell>
                  <TableCell>{customer.area_name || '—'}</TableCell>
                  <TableCell>{customer.total_loans || 0}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(customer.total_outstanding)}</TableCell>
                  <TableCell>
                    <Link to={`/applications?customer=${customer.id}`}>
                      <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No customers found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
