import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Send, Mail } from 'lucide-react'
import { Badge } from '../../components/ui/badge'
import { formatDateTime } from '../../lib/api'

export default function EmailPanel() {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [templateCode, setTemplateCode] = useState('')

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => (await api.get('/communication/email-templates')).data,
  })

  const { data: logs } = useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => (await api.get('/communication/email-logs?limit=20')).data,
  })

  const sendMutation = useMutation({
    mutationFn: async () => (await api.post('/communication/email-send', {
      recipient_email: to,
      subject,
      body,
      template_code: templateCode,
    })).data,
    onSuccess: () => { setTo(''); setSubject(''); setBody('') },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Email</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Send Email</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>To</Label><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@example.com" /></div>
            <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" /></div>
            <div><Label>Template</Label>
              <Select value={templateCode} onValueChange={setTemplateCode} placeholder="Select template">
                {templates?.map(t => <SelectItem key={t.id} value={t.template_code}>{t.template_name}</SelectItem>)}
              </Select>
            </div>
            <div><Label>Body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Email body..." /></div>
            <Button onClick={() => sendMutation.mutate()} className="w-full"><Send className="w-4 h-4 mr-2" />Send Email</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {templates?.map(t => (
                <div key={t.id} className="p-3 border rounded">
                  <div className="font-medium text-sm">{t.template_name}</div>
                  <div className="text-xs text-gray-500">{t.template_code}</div>
                  <div className="text-sm mt-1 text-gray-700">{t.template_body}</div>
                </div>
              ))}
              {!templates?.length && <div className="text-center text-gray-400 py-4">No templates</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Emails</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs?.map(log => (
              <div key={log.id} className="p-3 border rounded">
                <div className="flex justify-between">
                  <div className="font-medium">{log.recipient_email}</div>
                  <Badge variant={log.delivery_status === 'delivered' ? 'success' : log.delivery_status === 'failed' ? 'destructive' : 'warning'}>{log.delivery_status}</Badge>
                </div>
                <div className="text-sm text-gray-700 mt-1">{log.subject}</div>
                <div className="text-xs text-gray-400 mt-1">{formatDateTime(log.created_at)}</div>
              </div>
            ))}
            {!logs?.length && <div className="text-center text-gray-400 py-4">No emails</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}