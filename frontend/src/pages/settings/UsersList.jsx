import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function UsersList() {
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({
    email: '', password: '', role: 'field_officer',
    first_name: '', last_name: '', phone: '',
  })

  const { data: usersData, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await api.get('/auth/users')).data,
  })

  const usersList = Array.isArray(usersData) ? usersData : usersData?.users || []

  const createMutation = useMutation({
    mutationFn: async (data) => (await api.post('/auth/users', data)).data,
    onSuccess: () => {
      setShowForm(false)
      setEditingUser(null)
      setForm({ email: '', password: '', role: 'field_officer', first_name: '', last_name: '', phone: '' })
      refetch()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/auth/users/${id}`, data)).data,
    onSuccess: () => {
      setShowForm(false)
      setEditingUser(null)
      setForm({ email: '', password: '', role: 'field_officer', first_name: '', last_name: '', phone: '' })
      refetch()
    },
  })

  const toggleActive = (u) => {
    updateMutation.mutate({ id: u.id, data: { is_active: !u.is_active } })
  }

  const handleEdit = (u) => {
    setEditingUser(u)
    setForm({
      email: u.email,
      password: '',
      role: u.role,
      first_name: u.profile?.first_name || '',
      last_name: u.profile?.last_name || '',
      phone: u.profile?.phone || '',
    })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (editingUser) {
      const data = { ...form }
      if (!data.password) delete data.password
      updateMutation.mutate({ id: editingUser.id, data })
    } else {
      createMutation.mutate(form)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id)
    }
  }

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/auth/users/${id}`)).data,
    onSuccess: () => refetch(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingUser(null); setForm({ email: '', password: '', role: 'field_officer', first_name: '', last_name: '', phone: '' }) }}>
          <Plus className="w-4 h-4 mr-2" />Add User
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">{editingUser ? 'Edit User' : 'New User'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field_officer">Field Officer</SelectItem>
                    <SelectItem value="collection_agent">Collection Agent</SelectItem>
                    <SelectItem value="team_leader">Team Leader</SelectItem>
                    <SelectItem value="branch_admin">Branch Admin</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="lender">Lender</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep current' : ''}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingUser(null) }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.profile?.first_name || u.first_name} {u.profile?.last_name || u.last_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {u.role?.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>{u.profile?.phone || u.phone || '—'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(u)}
                  >
                    <Badge variant={u.is_active ? 'success' : 'destructive'}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(u)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!usersList.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">No users found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
