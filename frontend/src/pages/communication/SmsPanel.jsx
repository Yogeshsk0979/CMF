import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api, formatDateTime } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Send, MessageSquare, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

export default function SmsPanel() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [templateCode, setTemplateCode] = useState('')

  const { data: templates } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: async () => (await api.get('/communication/sms-templates')).data,
  })

  const { data: logs } = useQuery({
    queryKey: ['sms-logs'],
    queryFn: async () => (await api.get('/communication/sms-logs?limit=20')).data,
  })

  const sendMutation = useMutation({
    mutationFn: async () => (await api.post('/communication/sms-send', {
      recipient_phone: phone,
      message,
      template_code: templateCode,
    })).data,
    onSuccess: () => { setPhone(''); setMessage('') },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">SMS</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Send SMS</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Template</Label>
                <Select value={templateCode} onValueChange={setTemplateCode} placeholder="Select template">
                  {templates?.map(t => <SelectItem key={t.id} value={t.template_code}>{t.template_name}</SelectItem>)}
                </Select></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" /></div>
            <div><Label>Message</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Type message..." /></div>
            <Button onClick={() => sendMutation.mutate()} className="w-full"><Send className="w-4 h-4 mr-2" />Send SMS</Button>
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
        <CardHeader><CardTitle>Recent SMS Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs?.map(log => (
              <div key={log.id} className="p-3 border rounded flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">{log.recipient_phone}</div>
                  <div className="text-sm text-gray-700 mt-1">{log.message_body}</div>
                  <div className="text-xs text-gray-400 mt-1">{formatDateTime(log.created_at)}</div>
                </div>
                <Badge variant={log.delivery_status === 'delivered' ? 'success' : log.delivery_status === 'failed' ? 'destructive' : 'warning'}>{log.delivery_status}</Badge>
              </div>
            ))}
            {!logs?.length && <div className="text-center text-gray-400 py-4">No logs</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}