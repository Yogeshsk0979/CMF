import { useQuery, useMutation } from '@tanstack/react-query'
import { api, formatCurrency } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Save, Pencil } from 'lucide-react'

export default function SettingsPage() {
  const { data: general, refetch: refetchGeneral } = useQuery({
    queryKey: ['settings-general'],
    queryFn: async () => (await api.get('/settings/general')).data,
  })

  const { data: smsTemplates } = useQuery({
    queryKey: ['settings-sms'],
    queryFn: async () => (await api.get('/settings/sms-templates')).data,
  })

  const { data: emailTemplates } = useQuery({
    queryKey: ['settings-email'],
    queryFn: async () => (await api.get('/settings/email-templates')).data,
  })

  const { data: approvalLimits } = useQuery({
    queryKey: ['settings-approval'],
    queryFn: async () => (await api.get('/settings/approval-limits')).data,
  })

  const updateGeneralMutation = useMutation({
    mutationFn: async (data) => (await api.put('/settings/general', data)).data,
    onSuccess: () => refetchGeneral(),
  })

  const handleSaveGeneral = () => {
    const data = {}
    ['company_name', 'email', 'phone', 'address', 'gst_number', 'website', 'support_email'].forEach((key) => {
      const el = document.getElementById(`setting-${key}`)
      if (el) data[key] = el.value
    })
    updateGeneralMutation.mutate(data)
  }

  const settings = general || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage platform configuration</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="sms">SMS Templates</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="approval">Approval Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>Company Settings</CardTitle><CardDescription>Update your organization details</CardDescription></CardHeader>
            <CardContent className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Company Name</Label><Input id="setting-company_name" defaultValue={settings.company_name || ''} /></div>
                <div><Label>Email</Label><Input id="setting-email" type="email" defaultValue={settings.email || ''} /></div>
                <div><Label>Phone</Label><Input id="setting-phone" defaultValue={settings.phone || ''} /></div>
                <div><Label>GST Number</Label><Input id="setting-gst_number" defaultValue={settings.gst_number || ''} /></div>
                <div className="md:col-span-2"><Label>Address</Label><Textarea id="setting-address" defaultValue={settings.address || ''} rows={3} /></div>
                <div><Label>Website</Label><Input id="setting-website" defaultValue={settings.website || ''} /></div>
                <div><Label>Support Email</Label><Input id="setting-support_email" type="email" defaultValue={settings.support_email || ''} /></div>
              </div>
              <Button onClick={handleSaveGeneral} disabled={updateGeneralMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />{updateGeneralMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader><CardTitle>SMS Templates</CardTitle><CardDescription>Manage SMS message templates</CardDescription></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {smsTemplates?.length ? (
                  smsTemplates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.template_key}</TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-sm max-w-sm truncate">{t.message}</TableCell>
                      <TableCell><Badge variant={t.is_active ? 'success' : 'secondary'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No templates found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle>Email Templates</CardTitle><CardDescription>Manage email templates</CardDescription></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailTemplates?.length ? (
                  emailTemplates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.template_key}</TableCell>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-sm max-w-sm truncate">{t.subject}</TableCell>
                      <TableCell><Badge variant={t.is_active ? 'success' : 'secondary'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No templates found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader><CardTitle>Approval Limits</CardTitle><CardDescription>Configure approval authority by role and product</CardDescription></CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Max Amount</TableHead>
                  <TableHead>Min Tenure</TableHead>
                  <TableHead>Max Tenure</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvalLimits?.length ? (
                  approvalLimits.map((limit) => (
                    <TableRow key={limit.id}>
                      <TableCell className="capitalize">{limit.role?.replace('_', ' ')}</TableCell>
                      <TableCell>{limit.product_name || 'All'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(limit.max_amount)}</TableCell>
                      <TableCell>{limit.min_tenure || 0} months</TableCell>
                      <TableCell>{limit.max_tenure || 0} months</TableCell>
                      <TableCell><Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No approval limits configured</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}