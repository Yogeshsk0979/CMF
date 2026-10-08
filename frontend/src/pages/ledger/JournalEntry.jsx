import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Save, BookOpen } from 'lucide-react'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'

function emptyLine() {
  return { id: Math.random().toString(36).slice(2), account_id: '', debit: 0, credit: 0, narration: '' }
}

export default function JournalEntry() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [emptyLine(), emptyLine()],
  })

  const { data: accounts } = useQuery({
    queryKey: ['ledger-accounts-list'],
    queryFn: async () => (await api.get('/ledger/accounts')).data,
  })

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => (await api.get('/ledger/journal-entries?limit=20')).data,
  })

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post('/ledger/journal-entries', payload)).data,
    onSuccess: () => {
      toast.success('Journal entry created')
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-accounts-list'] })
      queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] })
      setForm({
        entry_date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        lines: [emptyLine(), emptyLine()],
      })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to create entry')
    },
  })

  function addLine() {
    setForm({ ...form, lines: [...form.lines, emptyLine()] })
  }

  function removeLine(id) {
    if (form.lines.length <= 2) {
      toast.error('A journal entry needs at least 2 lines')
      return
    }
    setForm({ ...form, lines: form.lines.filter((l) => l.id !== id) })
  }

  function updateLine(id, field, value) {
    setForm({
      ...form,
      lines: form.lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    })
  }

  const totalDebit = form.lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0)
  const totalCredit = form.lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0

  function handleSubmit() {
    if (!form.description) {
      toast.error('Please enter a description')
      return
    }
    if (!balanced) {
      toast.error(`Debits (${totalDebit}) must equal Credits (${totalCredit})`)
      return
    }
    if (form.lines.some((l) => !l.account_id)) {
      toast.error('Please select an account for every line')
      return
    }
    createMutation.mutate({
      entry_date: form.entry_date,
      reference: form.reference,
      description: form.description,
      lines: form.lines.map((l) => ({
        account_id: parseInt(l.account_id),
        debit: parseFloat(l.debit || 0),
        credit: parseFloat(l.credit || 0),
        narration: l.narration,
      })),
    })
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journal Entry</h1>
        <p className="text-sm text-gray-500">Record double-entry bookkeeping transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            New Journal Entry
          </CardTitle>
          <CardDescription>Debits must equal credits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Entry Date</Label>
              <Input
                type="date"
                value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Reference</Label>
              <Input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Optional reference number"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Account</TableHead>
                  <TableHead>Debit (₹)</TableHead>
                  <TableHead>Credit (₹)</TableHead>
                  <TableHead>Narration</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Select value={line.account_id} onValueChange={(v) => updateLine(line.id, 'account_id', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts?.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              {a.account_code} — {a.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.debit || ''}
                        onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={line.credit || ''}
                        onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                        placeholder="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.narration || ''}
                        onChange={(e) => updateLine(line.id, 'narration', e.target.value)}
                        placeholder="Line note"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" onClick={addLine}>
              <Plus className="w-4 h-4 mr-2" />Add Line
            </Button>
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-gray-500">Total Debit:</span>{' '}
                <span className="font-bold text-green-700">{formatCurrency(totalDebit)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Total Credit:</span>{' '}
                <span className="font-bold text-red-700">{formatCurrency(totalCredit)}</span>
              </div>
              <Badge variant={balanced ? 'success' : 'destructive'}>
                {balanced ? 'Balanced' : `Off by ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || !balanced}
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Saving...' : 'Post Entry'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Journal Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
              ) : entries?.length ? (
                entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.entry_date)}</TableCell>
                    <TableCell className="font-mono text-xs">{e.reference || '—'}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{e.line_count || 0}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(e.total_amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No journal entries yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
