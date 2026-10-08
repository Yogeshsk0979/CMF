import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { MapPin, Users, Plus, Pencil, Trash2, Shield } from 'lucide-react'

export default function AreaList() {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [form, setForm] = useState({
    area_name: '', city: '', pincode: '', branch_name: '',
    latitude: '', longitude: '', team_leader_id: '', is_active: true,
  })

  const { data: areas, isLoading, refetch } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => (await api.get('/areas')).data,
  })

  const { data: leadersData } = useQuery({
    queryKey: ['team-leaders'],
    queryFn: async () => (await api.get('/auth/users?role=team_leader')).data,
  })

  const leaders = Array.isArray(leadersData) ? leadersData : leadersData?.users || []

  const createMutation = useMutation({
    mutationFn: async (data) => (await api.post('/areas', data)).data,
    onSuccess: () => {
      setShowForm(false)
      setEditingArea(null)
      setForm({ area_name: '', city: '', pincode: '', branch_name: '', latitude: '', longitude: '', team_leader_id: '', is_active: true })
      refetch()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/areas/${id}`, data)).data,
    onSuccess: () => {
      setShowForm(false)
      setEditingArea(null)
      setForm({ area_name: '', city: '', pincode: '', branch_name: '', latitude: '', longitude: '', team_leader_id: '', is_active: true })
      refetch()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/areas/${id}`)).data,
    onSuccess: () => refetch(),
  })

  const toggleActive = (area) => {
    updateMutation.mutate({ id: area.id, data: { is_active: !area.is_active } })
  }

  const handleEdit = (area) => {
    setEditingArea(area)
    setForm({
      area_name: area.area_name,
      city: area.city || '',
      pincode: area.pincode || '',
      branch_name: area.branch_name || '',
      latitude: area.latitude || '',
      longitude: area.longitude || '',
      team_leader_id: area.team_leader_id || '',
      is_active: area.is_active,
    })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (editingArea) {
      updateMutation.mutate({ id: editingArea.id, data: form })
    } else {
      createMutation.mutate(form)
    }
  }

  const getLeaderName = (leaderId) => {
    const leader = leaders?.find(l => l.id === leaderId)
    return leader ? `${leader.profile?.first_name || ''} ${leader.profile?.last_name || ''}`.trim() : 'Unassigned'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Areas</h1>
        <Button onClick={() => { setShowForm(!showForm); setEditingArea(null); setForm({ area_name: '', city: '', pincode: '', branch_name: '', latitude: '', longitude: '', team_leader_id: '', is_active: true }) }}>
          <Plus className="w-4 h-4 mr-2" />Add Area
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">{editingArea ? 'Edit Area' : 'New Area'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Area Name</Label>
                <Input value={form.area_name} onChange={(e) => setForm({ ...form, area_name: e.target.value })} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
              </div>
              <div>
                <Label>Branch Name</Label>
                <Input value={form.branch_name} onChange={(e) => setForm({ ...form, branch_name: e.target.value })} />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </div>
              <div>
                <Label>Team Leader</Label>
                <Select value={form.team_leader_id} onValueChange={(v) => setForm({ ...form, team_leader_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign leader" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {leaders?.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.profile?.first_name || ''} {l.profile?.last_name || ''} ({l.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingArea ? 'Update Area' : 'Create Area'}
              </Button>
              {editingArea && (
                <Button variant="outline" onClick={() => { setShowForm(false); setEditingArea(null) }}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Pincode</TableHead>
                <TableHead>Team Leader</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">Loading...</TableCell>
                </TableRow>
              ) : areas?.length ? (
                areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{area.area_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{area.branch_name || '—'}</TableCell>
                    <TableCell>{area.city || '—'}</TableCell>
                    <TableCell>{area.pincode || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-gray-400" />
                        {getLeaderName(area.team_leader_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        {area.member_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={area.is_active ? 'success' : 'secondary'}>
                        {area.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(area)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(area)}
                          title={area.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {area.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { if (confirm('Delete this area?')) deleteMutation.mutate(area.id) }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">No areas found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
