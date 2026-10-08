import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api, formatDate, formatCurrency } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { MapPin, User, Home, CheckCircle2, Send } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function LocationMarker({ position, onPositionChange }) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    },
  })

  return position ? <Marker position={position} icon={customIcon} /> : null
}

export default function FieldVisit() {
  const { user } = useAuth()
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [position, setPosition] = useState(null)
  const [checklist, setChecklist] = useState({
    address_verified: false,
    customer_met: false,
    property_seen: false,
  })
  const [remarks, setRemarks] = useState('')

  const { data: customers } = useQuery({
    queryKey: ['customers-for-visit'],
    queryFn: async () => (await api.get('/customers?limit=50')).data,
  })

  const selectedCustomerData = customers?.customers?.find(c => c.id === parseInt(selectedCustomer))

  const submitMutation = useMutation({
    mutationFn: async () => (await api.post('/verification/field-visit', {
      customer_id: parseInt(selectedCustomer),
      latitude: position?.[0],
      longitude: position?.[1],
      checklist,
      remarks,
      verified_by: user.id,
      verification_date: new Date().toISOString().split('T')[0],
    })).data,
    onSuccess: () => {
      setSelectedCustomer('')
      setPosition(null)
      setChecklist({ address_verified: false, customer_met: false, property_seen: false })
      setRemarks('')
    },
  })

  const handleSubmit = () => {
    if (!selectedCustomer || !position) return
    submitMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Field Visit Verification</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Location Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden border">
                <MapContainer
                  center={[20.5937, 78.9629]}
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker
                    position={position}
                    onPositionChange={setPosition}
                  />
                </MapContainer>
              </div>
              {position && (
                <p className="text-xs text-gray-500 mt-2">
                  GPS captured: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
              )}
              {!position && (
                <p className="text-xs text-amber-600 mt-2">Click on the map to capture GPS location</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Select Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.customers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.first_name} {c.last_name} - {c.customer_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomerData && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium">{selectedCustomerData.first_name} {selectedCustomerData.last_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer Code</span>
                    <span className="font-medium">{selectedCustomerData.customer_code}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium">{selectedCustomerData.profile?.phone || selectedCustomerData.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Area</span>
                    <span className="font-medium">{selectedCustomerData.area_name || '—'}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Verification Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checklist.address_verified}
                onChange={(e) => setChecklist({ ...checklist, address_verified: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium">Address Verified</span>
                <p className="text-xs text-gray-500">Customer's address confirmed</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checklist.customer_met}
                onChange={(e) => setChecklist({ ...checklist, customer_met: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium">Customer Met</span>
                <p className="text-xs text-gray-500">Spoke with the customer</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={checklist.property_seen}
                onChange={(e) => setChecklist({ ...checklist, property_seen: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium">Property Seen</span>
                <p className="text-xs text-gray-500">Visited the property location</p>
              </div>
            </label>
          </div>

          <div>
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter verification remarks..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!selectedCustomer || !position || submitMutation.isPending}
            className="w-full md:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitMutation.isPending ? 'Submitting...' : 'Submit Verification'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Field Visits</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Met</TableHead>
                <TableHead>Property</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                  No field visits recorded yet
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
