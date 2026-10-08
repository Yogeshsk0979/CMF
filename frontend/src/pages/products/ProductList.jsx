import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, formatCurrency } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Plus, Pencil, Trash2, DollarSign, Percent } from 'lucide-react'

const LOAN_TYPES = ['individual', 'group', 'jlg', 'micro_enterprise', 'housing', 'education', 'emergency']

export default function ProductList() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [form, setForm] = useState({
    product_name: '', product_code: '', loan_type: 'individual',
    min_amount: '', max_amount: '', interest_rate: '',
    interest_type: 'reducing', min_tenure_months: 12,
    max_tenure_months: 36, processing_fee_type: 'fixed',
    processing_fee_value: 0, is_active: true,
  })

  const { data: products, refetch } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => (await api.get('/settings/products')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (data) => (await api.post('/settings/products', data)).data,
    onSuccess: () => {
      setShowForm(false)
      setEditingProduct(null)
      resetForm()
      refetch()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/settings/products/${id}`, data)).data,
    onSuccess: () => {
      setShowForm(false)
      setEditingProduct(null)
      resetForm()
      refetch()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/settings/products/${id}`)).data,
    onSuccess: () => refetch(),
  })

  function resetForm() {
    setForm({
      product_name: '', product_code: '', loan_type: 'individual',
      min_amount: '', max_amount: '', interest_rate: '',
      interest_type: 'reducing', min_tenure_months: 12,
      max_tenure_months: 36, processing_fee_type: 'fixed',
      processing_fee_value: 0, is_active: true,
    })
  }

  function handleEdit(p) {
    setEditingProduct(p)
    setForm({
      product_name: p.product_name,
      product_code: p.product_code,
      loan_type: p.loan_type,
      min_amount: p.min_amount,
      max_amount: p.max_amount,
      interest_rate: p.interest_rate,
      interest_type: p.interest_type || 'reducing',
      min_tenure_months: p.min_tenure_months,
      max_tenure_months: p.max_tenure_months,
      processing_fee_type: p.processing_fee_type || 'fixed',
      processing_fee_value: p.processing_fee_value || 0,
      is_active: p.is_active,
    })
    setShowForm(true)
  }

  function handleSubmit() {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan Products</h1>
          <p className="text-sm text-gray-500">Manage available loan products</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setEditingProduct(null); resetForm() }}>
          <Plus className="w-4 h-4 mr-2" />{showForm ? 'Cancel' : 'Add Product'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Product Name</Label><Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></div>
              <div><Label>Product Code</Label><Input value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} /></div>
              <div><Label>Loan Type</Label>
                <Select value={form.loan_type} onValueChange={(v) => setForm({ ...form, loan_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {LOAN_TYPES.map((t) => (<SelectItem key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Interest Rate (%)</Label><Input type="number" step="0.1" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} /></div>
              <div><Label>Min Amount</Label><Input type="number" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} /></div>
              <div><Label>Max Amount</Label><Input type="number" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></div>
              <div><Label>Interest Type</Label>
                <Select value={form.interest_type} onValueChange={(v) => setForm({ ...form, interest_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reducing">Reducing Balance</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Min Tenure (months)</Label><Input type="number" value={form.min_tenure_months} onChange={(e) => setForm({ ...form, min_tenure_months: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Max Tenure (months)</Label><Input type="number" value={form.max_tenure_months} onChange={(e) => setForm({ ...form, max_tenure_months: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Processing Fee Type</Label>
                <Select value={form.processing_fee_type} onValueChange={(v) => setForm({ ...form, processing_fee_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Processing Fee Value</Label><Input type="number" value={form.processing_fee_value} onChange={(e) => setForm({ ...form, processing_fee_value: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Status</Label>
                <Select value={form.is_active ? 'active' : 'inactive'} onValueChange={(v) => setForm({ ...form, is_active: v === 'active' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingProduct(null); resetForm() }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.length ? (
          products.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="font-semibold text-lg">{p.product_name}</div>
                    <div className="text-sm text-gray-500">
                      {p.product_code} • {p.loan_type?.replace('_', ' ')}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="info"><Percent className="w-3 h-3 mr-1" />{p.interest_rate}%</Badge>
                      <span className="text-xs text-gray-400">{p.interest_type}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="w-3 h-3 text-gray-400" />
                      <span>{formatCurrency(p.min_amount)} - {formatCurrency(p.max_amount)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Tenure: {p.min_tenure_months} - {p.max_tenure_months} months
                    </div>
                    <div className="text-xs text-gray-500">
                      Processing: {p.processing_fee_type === 'percentage' ? p.processing_fee_value + '%' : formatCurrency(p.processing_fee_value)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={p.is_active ? 'success' : 'secondary'}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(p.id) }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full"><CardContent className="p-8 text-center text-gray-400">No products found</CardContent></Card>
        )}
      </div>
    </div>
  )
}