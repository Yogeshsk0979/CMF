import { useQuery, useMutation } from '@tanstack/react-query'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { MapPin, Phone } from 'lucide-react'
import { useState } from 'react'

export default function CustomerDues() {
  const { user } = useAuth()
  const [areaFilter, setAreaFilter] = useState('')

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => (await api.get('/areas')).data,
  })

  const { data: dues, isLoading } = useQuery({
    queryKey: ['field-dues', areaFilter],
    queryFn: async () => {
      const url = areaFilter ? `/emi/dues?area_id=${areaFilter}` : '/emi/dues'
      return (await api.get(url)).data
    },
  })

  const remindMutation = useMutation({
    mutationFn: async (emiId) => (await api.post(`/emi/${emiId}/send-reminder`)).data,
  })

  const totalDue = dues?.reduce((s, d) => s + parseFloat(d.emi_amount || 0), 0) || 0
  const overdueTotal = dues?.filter(d => d.is_overdue).reduce((s, d) => s + parseFloat(d.emi_amount || 0), 0) || 0

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Customer Dues</h1>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="h-10 px-3 border rounded-md text-sm bg-white"
          >
            <option value="">All Areas</option>
            {areas?.map((a) => (
              <option key={a.id} value={a.id}>{a.area_name}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {dues?.length || 0} customers with due EMIs
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Due</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalDue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Overdue Amount</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Customers</div>
            <div className="text-2xl font-bold text-blue-600">{dues?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Loan #</TableHead>
              <TableHead>EMI #</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-400">Loading...</TableCell>
              </TableRow>
            ) : dues?.length ? (
              dues.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium">{d.first_name} {d.last_name}</div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{d.area_name || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {d.phone || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{d.loan_number}</TableCell>
                  <TableCell>#{d.emi_number}</TableCell>
                  <TableCell>{formatDate(d.due_date)}</TableCell>
                  <TableCell>{d.days_overdue || 0}</TableCell>
                  <TableCell>{formatCurrency(d.emi_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={d.is_overdue ? 'destructive' : 'warning'}>
                      {d.is_overdue ? 'Overdue' : 'Due'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remindMutation.mutate(d.id)}
                        title="Send reminder"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      {d.is_overdue && (
                        <Badge variant="destructive" className="text-xs">{d.days_overdue}d</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-400">No dues found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
