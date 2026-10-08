import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api, formatCurrency, formatDate, formatDateTime } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from '../../components/ui/table'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import {
  CheckCircle2, Clock, AlertCircle, XCircle, Send, FileText, HelpCircle, Edit, ExternalLink,
  ShieldCheck, UserCheck, Home, Briefcase, CreditCard, Users, Check, Eye, LayoutDashboard, ClipboardList, MessageSquare, Camera,
  MapPin, Sliders, DollarSign, Navigation, Compass, CheckSquare, Square, Percent, Landmark, UserPlus
} from 'lucide-react'
import { useState } from 'react'
import { CameraPhotoCapture } from './ApplicationForm'

const STATUS_COLORS = {
  draft: 'secondary',
  submitted: 'info',
  in_review: 'warning',
  query_raised: 'destructive',
  field_visit_completed: 'info',
  approved: 'success',
  rejected: 'destructive',
  disbursed: 'success',
  completed: 'success',
  cancelled: 'secondary'
}

const DOCUMENT_CATEGORIES = [
  'Identity & Aadhaar Card',
  'PAN Card',
  'Income & Employment Details',
  'Banking & Passbook',
  'Residence & Address Proof',
  'Applicant Photo & KYC',
  'Other Details / Documents'
]

const REVIEW_SECTIONS = [
  { id: 'kyc', name: '1. Applicant Profile & KYC', icon: UserCheck, checkKey: 'kyc_verified', catName: 'Identity & Aadhaar Card' },
  { id: 'residence', name: '2. Residence & Property', icon: Home, checkKey: 'residence_verified', catName: 'Residence & Address Proof' },
  { id: 'income', name: '3. Income & Salary Slips', icon: Briefcase, checkKey: 'income_verified', catName: 'Income & Employment Details' },
  { id: 'banking', name: '4. Banking & Passbook', icon: CreditCard, checkKey: 'banking_verified', catName: 'Banking & Passbook' },
  { id: 'family', name: '5. Family & References', icon: Users, checkKey: 'family_verified', catName: 'Other Details / Documents' },
  { id: 'field_visit', name: '6. Field Visit Verification', icon: MapPin, checkKey: 'field_visit_verified', catName: 'Field Visit' },
  { id: 'overview', name: 'Overview Summary', icon: LayoutDashboard },
  { id: 'matrix', name: 'Topic Progress Matrix', icon: ClipboardList },
  { id: 'notes', name: 'Notes & Audit Log', icon: MessageSquare },
]

function extractUrl(val) {
  if (!val) return null
  if (typeof val === 'string' && val.trim()) return val.trim()
  if (typeof val === 'object' && val !== null) {
    if (typeof val.url === 'string' && val.url.trim()) return val.url.trim()
    if (typeof val.dataUrl === 'string' && val.dataUrl.trim()) return val.dataUrl.trim()
  }
  return null
}

function base64ToBlob(base64Data) {
  try {
    const parts = base64Data.split(';base64,')
    const contentType = parts[0].replace('data:', '')
    const raw = window.atob(parts[1])
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }
    return new Blob([uInt8Array], { type: contentType })
  } catch (e) {
    console.error('Failed to convert base64 to blob', e)
    return null
  }
}

export function handleViewDocument(docVal, title = 'Document') {
  if (!docVal) return

  const targetUrl = extractUrl(docVal)
  if (!targetUrl || typeof targetUrl !== 'string') return

  if (targetUrl.startsWith('data:')) {
    const blob = base64ToBlob(targetUrl)
    if (blob) {
      const blobUrl = URL.createObjectURL(blob)
      const win = window.open(blobUrl, '_blank')
      if (!win) {
        toast.error('Pop-up blocked. Please allow pop-ups to view documents.')
      }
      return
    }
  }

  let finalUrl = targetUrl
  if (targetUrl.startsWith('/uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const baseUrl = apiUrl.replace(/\/api\/?$/, '')
    finalUrl = `${baseUrl}${targetUrl}`
  }

  const win = window.open(finalUrl, '_blank')
  if (!win) {
    toast.error('Pop-up blocked. Please allow pop-ups to view documents.')
  }
}

function DocumentPreviewCard({ title, docVal, onPreview }) {
  const url = extractUrl(docVal)
  if (!url) {
    return (
      <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center gap-1.5 h-32 text-slate-400">
        <FileText className="w-6 h-6 text-slate-300" />
        <span className="text-[11px] font-semibold text-slate-500">{title}</span>
        <span className="text-[10px] text-slate-400">Not Uploaded</span>
      </div>
    )
  }

  const isImage = url.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(url)

  return (
    <div className="group relative rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between h-36">
      <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-800 truncate max-w-[130px]" title={title}>
          {title}
        </span>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
          {isImage ? 'IMAGE' : 'PDF/DOC'}
        </Badge>
      </div>

      <div className="flex-1 p-2 flex items-center justify-center bg-slate-950/5 relative overflow-hidden">
        {isImage ? (
          <img src={url} alt={title} className="max-h-20 object-contain rounded-md group-hover:scale-105 transition-transform" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-600">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-[10px] font-medium text-slate-500">Document File</span>
          </div>
        )}
      </div>

      <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-around gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 flex-1 gap-1"
          onClick={() => onPreview({ url, title })}
        >
          <Eye className="w-3 h-3" /> Preview
        </Button>
        <div className="w-px h-4 bg-slate-200" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 flex-1 gap-1"
          onClick={() => handleViewDocument(url, title)}
        >
          <ExternalLink className="w-3 h-3" /> New Tab
        </Button>
      </div>
    </div>
  )
}

function CategoryVerificationActionBar({ catTitle, isVerified, onToggleVerify, onRaiseQuery, isVerifierRole }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
      isVerified
        ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-900'
        : 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-amber-100/50 border-amber-300 text-amber-900'
    }`}>
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg font-bold shrink-0 ${isVerified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
          {isVerified ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {catTitle} Status
          </div>
          <div className="text-sm font-extrabold flex items-center gap-2">
            <span>{isVerified ? 'VERIFIED & AUDITED' : 'PENDING REVIEW & VERIFICATION'}</span>
            {isVerified && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/80 text-emerald-900 rounded-md border border-emerald-300">
                LOCKED FOR EDITING
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isVerifierRole && (
          <Button
            size="sm"
            onClick={onToggleVerify}
            className={`font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all ${
              isVerified
                ? 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-500 ring-2 ring-emerald-500/20'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isVerified ? 'text-emerald-600' : 'text-emerald-100'}`} />
            {isVerified ? 'VERIFIED (CLICK TO UNMARK)' : 'MARK THIS CATEGORY AS VERIFIED'}
          </Button>
        )}
        {onRaiseQuery && (
          <Button
            size="sm"
            variant={isVerified ? 'secondary' : 'outline'}
            className={isVerified ? 'bg-emerald-700 hover:bg-emerald-800 text-white text-xs border-0 font-medium' : 'border-amber-400 text-amber-900 hover:bg-amber-100 font-semibold text-xs'}
            onClick={onRaiseQuery}
          >
            Raise Query
          </Button>
        )}
      </div>
    </div>
  )
}

function formatSafeValue(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (typeof val === 'number') return val.toString()
  if (typeof val === 'string') return val.trim() || '—'
  if (Array.isArray(val)) {
    if (val.length === 0) return '—'
    return val.map(item => formatSafeValue(item)).filter(Boolean).join(', ')
  }
  if (typeof val === 'object') {
    if (val.name) return `${val.name}${val.relation ? ` (${val.relation})` : ''}`
    if (val.first_name) return `${val.first_name} ${val.last_name || ''}`.trim()
    if (val.label) return val.label
    if (val.url) return val.name || val.url
    const parts = []
    if (val.name) parts.push(val.name)
    if (val.relation) parts.push(val.relation)
    if (val.occupation) parts.push(val.occupation)
    if (val.monthly_income) parts.push(`₹${val.monthly_income}`)
    if (parts.length > 0) return parts.join(' - ')
    return JSON.stringify(val)
  }
  return String(val)
}

function DetailFieldValue({ label, value, highlight = false }) {
  const displayVal = formatSafeValue(value)
  return (
    <div className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-xs font-bold mt-0.5 truncate ${highlight ? 'text-blue-700 font-extrabold' : 'text-slate-900'}`} title={displayVal}>
        {displayVal}
      </div>
    </div>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('kyc')
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState('general')
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showQueryModal, setShowQueryModal] = useState(false)
  const [queryCategory, setQueryCategory] = useState(DOCUMENT_CATEGORIES[0])
  const [queryDetails, setQueryDetails] = useState('')
  const [previewMedia, setPreviewMedia] = useState(null)

  // Field Visit state
  const [showFieldVisitModal, setShowFieldVisitModal] = useState(false)
  const [fvLatitude, setFvLatitude] = useState('')
  const [fvLongitude, setFvLongitude] = useState('')
  const [fvLocationAddress, setFvLocationAddress] = useState('')
  const [fvVisitPhotoUrl, setFvVisitPhotoUrl] = useState('')
  const [fvChecklist, setFvChecklist] = useState({
    residence_verified: true,
    neighbor_verified: true,
    income_verified: true,
    applicant_met: true,
  })
  const [fvRemarks, setFvRemarks] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  // Field Officer Assignment state
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOfficerId, setSelectedOfficerId] = useState('')

  // Admin Interest Rate & Loan Terms Edit State
  const [showInterestModal, setShowInterestModal] = useState(false)
  const [editInterestRate, setEditInterestRate] = useState('')
  const [editLoanAmount, setEditLoanAmount] = useState('')
  const [editTenureMonths, setEditTenureMonths] = useState('')

  const { data: app, isLoading, error } = useQuery({
    queryKey: ['application', id],
    queryFn: async () => (await api.get(`/applications/${id}`)).data,
  })

  const { data: topics } = useQuery({
    queryKey: ['application-topics', id],
    queryFn: async () => (await api.get(`/applications/${id}/topics`)).data,
  })

  const { data: notes } = useQuery({
    queryKey: ['application-notes', id],
    queryFn: async () => (await api.get(`/applications/${id}/notes`)).data,
  })

  const { data: staffUsers } = useQuery({
    queryKey: ['staff-users'],
    queryFn: async () => (await api.get('/auth/users')).data,
    enabled: ['super_admin', 'branch_admin', 'team_leader'].includes(user?.role)
  })

  const addNoteMutation = useMutation({
    mutationFn: async (note) => (await api.post(`/applications/${id}/notes`, note)).data,
    onSuccess: () => {
      queryClient.invalidateQueries(['application-notes', id])
      setNoteText('')
    },
  })

  const approveMutation = useMutation({
    mutationFn: async () => (await api.post(`/applications/${id}/approve`, { remarks: noteText || 'Approved' })).data,
    onSuccess: () => {
      toast.success('Application approved!')
      queryClient.invalidateQueries(['application', id])
      setNoteText('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: async () => (await api.post(`/applications/${id}/reject`, { reason: rejectReason })).data,
    onSuccess: () => {
      toast.success('Application rejected')
      queryClient.invalidateQueries(['application', id])
      setRejectReason('')
      setShowReject(false)
    },
  })

  const raiseQueryMutation = useMutation({
    mutationFn: async () => (await api.post(`/applications/${id}/raise-query`, { category_name: queryCategory, query_text: queryDetails })).data,
    onSuccess: () => {
      toast.success('Query raised successfully')
      queryClient.invalidateQueries(['application', id])
      queryClient.invalidateQueries(['application-notes', id])
      setShowQueryModal(false)
      setQueryDetails('')
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Failed to raise query')
    }
  })

  const updateVerificationMutation = useMutation({
    mutationFn: async (updatedChecks) => {
      await api.put(`/applications/${id}/topics/verification_checks`, {
        data: updatedChecks,
        is_completed: true,
        completion_pct: 100,
      })
    },
    onSuccess: () => {
      toast.success('Verification status updated!')
      queryClient.invalidateQueries(['application-topics', id])
    }
  })

  const fieldVisitMutation = useMutation({
    mutationFn: async (payload) => (await api.post(`/applications/${id}/field-visit`, payload)).data,
    onSuccess: () => {
      toast.success('Field Visit verification recorded successfully!')
      queryClient.invalidateQueries(['application', id])
      queryClient.invalidateQueries(['application-topics', id])
      setShowFieldVisitModal(false)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Failed to submit Field Visit report')
    }
  })

  const assignFvMutation = useMutation({
    mutationFn: async (officer_id) => (await api.post(`/applications/${id}/assign-fv`, { officer_id })).data,
    onSuccess: () => {
      toast.success('Field Officer assigned successfully!')
      queryClient.invalidateQueries(['application-topics', id])
      queryClient.invalidateQueries(['application', id])
      setShowAssignModal(false)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Failed to assign Field Officer')
    }
  })

  const updateLoanTermsMutation = useMutation({
    mutationFn: async (payload) => (await api.put(`/applications/${id}`, payload)).data,
    onSuccess: () => {
      toast.success('Loan terms & interest rate updated!')
      queryClient.invalidateQueries(['application', id])
      setShowInterestModal(false)
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Failed to update loan terms')
    }
  })

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setFvLatitude(lat)
        setFvLongitude(lng)
        setFvLocationAddress(`Lat: ${lat}, Long: ${lng} (On-Site GPS Capture)`)
        setIsLocating(false)
        toast.success('GPS Location captured!')
      },
      (err) => {
        setIsLocating(false)
        toast.error('Could not get GPS location. Please allow location permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const submitNote = () => {
    if (!noteText.trim()) return
    addNoteMutation.mutate({ note_text: noteText, note_type: noteType, is_internal: noteType !== 'external' })
  }

  if (isLoading) return <div className="text-center py-8 text-gray-400">Loading application...</div>
  if (error) return <div className="text-center py-8 text-red-500">Failed to load application</div>
  if (!app) return <div className="text-center py-8 text-gray-400">Application not found</div>

  const completedTopics = topics?.filter(t => t.is_completed).length || 0
  const canApprove = ['in_review', 'submitted', 'query_raised', 'field_visit_completed'].includes(app.status) && ['branch_admin', 'super_admin'].includes(user?.role)
  const canRaiseQuery = ['in_review', 'submitted', 'field_visit_completed'].includes(app.status) && ['branch_admin', 'super_admin'].includes(user?.role)
  const canEditAndResubmit = ['customer', 'team_leader', 'field_officer', 'collection_agent', 'branch_admin', 'super_admin'].includes(user?.role) && ['draft', 'submitted', 'in_review', 'query_raised'].includes(app.status)
  const isVerifierRole = ['branch_admin', 'super_admin'].includes(user?.role)
  const isAdminRole = ['branch_admin', 'super_admin', 'team_leader'].includes(user?.role)
  const canPerformFieldVisit = ['field_officer', 'collection_agent', 'team_leader', 'branch_admin', 'super_admin'].includes(user?.role)

  const fieldOfficersList = staffUsers?.users?.filter(u =>
    ['field_officer', 'collection_agent', 'team_leader', 'branch_admin'].includes(u.role)
  ) || []

  // Map topics data
  const topicMap = {}
  topics?.forEach(t => {
    let parsed = t.topic_data || {}
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed) } catch (e) {}
    }
    topicMap[t.topic_code] = parsed
  })

  const applicant = topicMap.applicant_details || {}
  const basic = topicMap.basic_details || {}
  const kyc = topicMap.kyc_details || {}
  const work = topicMap.work_details || {}
  const income = topicMap.income_details || {}
  const obligations = topicMap.obligations || {}
  const banking = topicMap.banking_details || {}
  const property = topicMap.property_details || {}
  const family = topicMap.family_details || {}
  const references = topicMap.family_references || {}
  const verificationChecks = topicMap.verification_checks || {}
  const fieldVisitData = topicMap.field_visit || {}

  const isFieldVisitCompleted = app.status === 'field_visit_completed' || app.status === 'approved' || app.status === 'disbursed' || !!fieldVisitData.verified_at

  // Live camera selfie (from 3rd tab kyc_details)
  const kycLiveSelfieUrl =
    extractUrl(kyc.live_selfie_url) ||
    extractUrl(kyc.photo_url) ||
    extractUrl(applicant.live_selfie_url) ||
    null

  // Uploaded profile photo (from 1st tab applicant_details)
  const uploadedProfilePhotoUrl =
    extractUrl(applicant.profile_photo) ||
    extractUrl(applicant.photo_url) ||
    extractUrl(basic.profile_photo) ||
    extractUrl(basic.photo_url) ||
    extractUrl(app.customer_photo) ||
    extractUrl(app.profile_photo) ||
    null

  // Primary fallback for header banner avatar
  const applicantPhotoUrl = kycLiveSelfieUrl || uploadedProfilePhotoUrl || null

  const handleToggleVerification = (catKey) => {
    if (!isVerifierRole) return
    const updated = { ...verificationChecks, [catKey]: !verificationChecks[catKey] }
    updateVerificationMutation.mutate(updated)
  }

  const handleOpenQueryForCategory = (catName) => {
    setQueryCategory(catName)
    setShowQueryModal(true)
  }

  const openInterestModal = () => {
    setEditLoanAmount(app.approved_amount || app.loan_amount || '')
    setEditInterestRate(app.interest_rate || '12')
    setEditTenureMonths(app.tenure_months || '24')
    setShowInterestModal(true)
  }

  const calcEmi = (p, rRate, nMonths) => {
    const pVal = parseFloat(p) || 0
    const rVal = (parseFloat(rRate) || 0) / 12 / 100
    const nVal = parseInt(nMonths, 10) || 0
    if (!pVal || !rVal || !nVal) return 0
    const emi = (pVal * rVal * Math.pow(1 + rVal, nVal)) / (Math.pow(1 + rVal, nVal) - 1)
    return Math.round(emi)
  }

  const calculatedEmi = calcEmi(editLoanAmount, editInterestRate, editTenureMonths)

  const handleSaveInterestAndTerms = () => {
    const p = parseFloat(editLoanAmount)
    const r = parseFloat(editInterestRate)
    const n = parseInt(editTenureMonths, 10)
    if (!p || p <= 0 || !r || r <= 0 || !n || n <= 0) {
      toast.error('Please enter valid positive numbers for Loan Amount, Interest Rate, and Tenure.')
      return
    }
    updateLoanTermsMutation.mutate({
      loan_amount: p,
      approved_amount: p,
      interest_rate: r,
      tenure_months: n,
      emi_amount: calculatedEmi,
    })
  }

  const handleSubmitFieldVisit = () => {
    if (!fvVisitPhotoUrl) {
      toast.error('Field Visit Live Camera Photo is required!')
      return
    }
    fieldVisitMutation.mutate({
      latitude: fvLatitude,
      longitude: fvLongitude,
      location_address: fvLocationAddress,
      visit_photo_url: fvVisitPhotoUrl,
      checklist: fvChecklist,
      remarks: fvRemarks,
    })
  }

  const verifiedCount = [
    verificationChecks.kyc_verified,
    verificationChecks.residence_verified,
    verificationChecks.income_verified,
    verificationChecks.banking_verified,
    verificationChecks.family_verified,
    isFieldVisitCompleted,
  ].filter(Boolean).length

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Query Banner for Applicant / TL */}
      {app.status === 'query_raised' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-900">Document / Details Query Raised</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-200 text-amber-900 rounded-full">Action Required</span>
              </div>
              <p className="text-sm text-amber-800 mt-1 font-medium leading-relaxed">
                {app.notes || 'Verification team requested updates on your submitted documents or application details.'}
              </p>
              {canEditAndResubmit && (
                <div className="mt-4 flex items-center gap-3">
                  <Link to={`/applications/${app.id}/edit`}>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-xs flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Fix Details & Resubmit Application
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {applicantPhotoUrl ? (
            <div
              className="relative group w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-sm bg-slate-100 shrink-0 cursor-pointer"
              onClick={() => setPreviewMedia({ url: applicantPhotoUrl, title: "Applicant Live Camera Photo" })}
              title="Click to view live camera photo"
            >
              <img src={applicantPhotoUrl} alt="Applicant Live Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                View
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
              <UserCheck className="w-7 h-7 text-slate-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">{app.application_number}</h1>
              {applicantPhotoUrl && (
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-blue-600" /> Live Photo Captured
                </span>
              )}
              <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-600" /> Rate: {app.interest_rate || 12}% p.a.
              </span>
              {fieldVisitData.assigned_officer_name && (
                <span className="text-[11px] font-bold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                  <UserPlus className="w-3 h-3 text-indigo-600" /> FV Officer: {fieldVisitData.assigned_officer_name}
                </span>
              )}
            </div>
            <p className="text-slate-600 text-sm font-medium mt-0.5">
              {applicant.first_name || app.first_name} {applicant.last_name || app.last_name} &bull; {applicant.email || app.email} &bull; {applicant.phone || app.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_COLORS[app.status] || 'secondary'} className="text-sm px-3 py-1 capitalize">
            {app.status?.replace('_', ' ')}
          </Badge>

          {/* Admin Assign FV Officer Button */}
          {isAdminRole && (
            <Button
              variant="outline"
              size="sm"
              className="border-indigo-300 text-indigo-800 hover:bg-indigo-50 font-bold"
              onClick={() => {
                setSelectedOfficerId(fieldVisitData.assigned_officer_id || '')
                setShowAssignModal(true)
              }}
            >
              <UserPlus className="w-4 h-4 mr-1 text-indigo-600" />
              {fieldVisitData.assigned_officer_name ? 'Re-Assign FV Officer' : 'Assign FV Officer'}
            </Button>
          )}

          {/* Admin Interest Rate & Loan Terms Edit Button */}
          {isAdminRole && (
            <Button variant="outline" size="sm" className="border-blue-300 text-blue-800 hover:bg-blue-50 font-bold" onClick={openInterestModal}>
              <Sliders className="w-4 h-4 mr-1 text-blue-600" /> Terms & Rate
            </Button>
          )}

          {/* Perform Field Visit Button */}
          {canPerformFieldVisit && (
            <Button
              variant="outline"
              size="sm"
              className={isFieldVisitCompleted ? 'border-emerald-400 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold' : 'border-indigo-400 text-indigo-800 hover:bg-indigo-50 font-bold'}
              onClick={() => {
                setFvLatitude(fieldVisitData.latitude || '')
                setFvLongitude(fieldVisitData.longitude || '')
                setFvLocationAddress(fieldVisitData.location_address || '')
                setFvVisitPhotoUrl(fieldVisitData.visit_photo_url || '')
                setFvRemarks(fieldVisitData.remarks || '')
                setShowFieldVisitModal(true)
              }}
            >
              <MapPin className="w-4 h-4 mr-1 text-indigo-600" />
              {isFieldVisitCompleted ? 'Update Field Visit Report' : 'Perform Field Visit'}
            </Button>
          )}

          {/* Disbursement Button (Enabled AFTER Field Visit) */}
          {isFieldVisitCompleted ? (
            app.status !== 'disbursed' && isAdminRole && (
              <Link to="/disbursements">
                <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold shadow-sm">
                  <Landmark className="w-4 h-4 mr-1" /> Proceed to Disbursement
                </Button>
              </Link>
            )
          ) : (
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1" title="Field Visit must be completed before Disbursement">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> FV Required for Disbursal
            </span>
          )}

          {canApprove && app.status !== 'disbursed' && (
            <>
              <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-semibold" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                <CheckCircle2 className="w-4 h-4 mr-1" />{approveMutation.isPending ? 'Approving...' : 'Approve Application'}
              </Button>
              {!showReject ? (
                <Button variant="destructive" size="sm" onClick={() => setShowReject(true)}>
                  <XCircle className="w-4 h-4 mr-1" />Reject
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason..." className="h-9 text-sm" />
                  <Button variant="destructive" size="sm" onClick={() => rejectMutation.mutate()} disabled={!rejectReason}>Confirm</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowReject(false)}>Cancel</Button>
                </div>
              )}
            </>
          )}
          {canRaiseQuery && (
            <Button variant="outline" size="sm" className="border-amber-500 text-amber-700 hover:bg-amber-50 font-semibold" onClick={() => setShowQueryModal(true)}>
              <AlertCircle className="w-4 h-4 mr-1 text-amber-600" />Raise Query
            </Button>
          )}
          {canEditAndResubmit && (
            <Link to={`/applications/${app.id}/edit`}>
              <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 font-semibold">
                <Edit className="w-4 h-4 mr-1" />Edit & Resubmit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Assign Field Verifier Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Assign Field Verifier / Collection Officer</h3>
                  <p className="text-xs text-slate-500">Assign on-field staff member for physical address & site visit</p>
                </div>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Staff Role Notice:</strong> Field Verifiers and Collection Agents are interchangeable staff roles. Selected officers will receive this physical field visit task.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Field Officer / Collection Agent
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Select Staff Officer --</option>
                  {fieldOfficersList.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.first_name || off.last_name ? `${off.first_name || ''} ${off.last_name || ''}`.trim() : off.email} ({off.role?.replace('_', ' ')}) - {off.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOfficerId && (
                <div className="p-3 rounded-xl bg-slate-50 border text-xs space-y-1">
                  {(() => {
                    const selectedObj = fieldOfficersList.find(o => o.id === selectedOfficerId)
                    if (!selectedObj) return null
                    return (
                      <>
                        <div className="font-bold text-slate-900">{selectedObj.first_name} {selectedObj.last_name}</div>
                        <div className="text-slate-600">Email: {selectedObj.email}</div>
                        <div className="text-slate-600">Role: {selectedObj.role?.replace('_', ' ')}</div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4"
                disabled={!selectedOfficerId || assignFvMutation.isPending}
                onClick={() => assignFvMutation.mutate(selectedOfficerId)}
              >
                {assignFvMutation.isPending ? 'Assigning...' : 'Confirm & Assign Officer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Change Interest Rate & Loan Terms Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Adjust Interest Rate & Loan Terms</h3>
                  <p className="text-xs text-slate-500">Admin override for interest rate, tenure, and approved loan amount</p>
                </div>
              </div>
              <button onClick={() => setShowInterestModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Approved Loan Amount (₹)
                </label>
                <Input
                  type="number"
                  value={editLoanAmount}
                  onChange={(e) => setEditLoanAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  className="font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Interest Rate (% p.a.)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={editInterestRate}
                  onChange={(e) => setEditInterestRate(e.target.value)}
                  placeholder="e.g. 12.5"
                  className="font-bold text-base text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tenure (Months)
                </label>
                <Input
                  type="number"
                  value={editTenureMonths}
                  onChange={(e) => setEditTenureMonths(e.target.value)}
                  placeholder="e.g. 24"
                  className="font-bold text-base"
                />
              </div>

              {/* Calculated EMI Preview Card */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-700">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Calculated Monthly EMI Preview
                </div>
                <div className="text-2xl font-extrabold text-emerald-400">
                  {formatCurrency(calculatedEmi)} / month
                </div>
                <div className="text-xs text-slate-300 flex justify-between border-t border-slate-800 pt-2">
                  <span>Loan Amount: {formatCurrency(editLoanAmount || 0)}</span>
                  <span>Rate: {editInterestRate || 0}% p.a.</span>
                  <span>Tenure: {editTenureMonths || 0} mos</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowInterestModal(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                disabled={updateLoanTermsMutation.isPending}
                onClick={handleSaveInterestAndTerms}
              >
                {updateLoanTermsMutation.isPending ? 'Saving...' : 'Update Rate & Loan Terms'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Field Visit Verification Modal */}
      {showFieldVisitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Field Visit Verification & On-Site Audit</h3>
                  <p className="text-xs text-slate-500">Capture mandatory live camera photo and GPS location on-site</p>
                </div>
              </div>
              <button onClick={() => setShowFieldVisitModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Step 1: Live Camera Photo Capture */}
              <div className="space-y-2 border-b pb-4">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  1. Mandatory Field Visit Live Photo Capture
                </label>
                <div className="bg-slate-50 p-3 rounded-xl border">
                  <CameraPhotoCapture
                    photoUrl={fvVisitPhotoUrl}
                    onCapture={(url) => setFvVisitPhotoUrl(url)}
                  />
                </div>
              </div>

              {/* Step 2: On-Site GPS Geolocation */}
              <div className="space-y-2 border-b pb-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    2. Mandatory GPS Geo-location
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold text-xs gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    {isLocating ? 'Locating...' : 'Get Current GPS Location'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Latitude</label>
                    <Input value={fvLatitude} onChange={(e) => setFvLatitude(e.target.value)} placeholder="e.g. 19.0760" className="text-xs" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Longitude</label>
                    <Input value={fvLongitude} onChange={(e) => setFvLongitude(e.target.value)} placeholder="e.g. 72.8777" className="text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500">Physical Address / Location Details</label>
                  <Input value={fvLocationAddress} onChange={(e) => setFvLocationAddress(e.target.value)} placeholder="Physical address visited..." className="text-xs" />
                </div>
              </div>

              {/* Step 3: Audit Checklist */}
              <div className="space-y-2 border-b pb-4">
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  3. Field Officer Physical Audit Checklist
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'residence_verified', label: 'Residence verified & matches address proof' },
                    { key: 'neighbor_verified', label: 'Locality & neighbor inquiry positive' },
                    { key: 'income_verified', label: 'Business premises / workplace confirmed' },
                    { key: 'applicant_met', label: 'Applicant met in-person during physical visit' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-lg border bg-slate-50/80 hover:bg-slate-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fvChecklist[item.key] || false}
                        onChange={(e) => setFvChecklist({ ...fvChecklist, [item.key]: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="font-semibold text-slate-800">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 4: Remarks */}
              <div>
                <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-1">
                  4. Field Officer Audit Remarks & Notes
                </label>
                <Textarea
                  value={fvRemarks}
                  onChange={(e) => setFvRemarks(e.target.value)}
                  placeholder="Enter notes on residence condition, family background, business stability..."
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowFieldVisitModal(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5"
                disabled={fieldVisitMutation.isPending || !fvVisitPhotoUrl}
                onClick={handleSubmitFieldVisit}
              >
                {fieldVisitMutation.isPending ? 'Saving Report...' : 'Save Field Visit Report & Proceed'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Raise Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Raise Query to Applicant / TL</h3>
              </div>
              <button onClick={() => setShowQueryModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Document / Section Category
                </label>
                <select
                  value={queryCategory}
                  onChange={(e) => setQueryCategory(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  {DOCUMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Query Details & Instructions for Resubmission
                </label>
                <Textarea
                  value={queryDetails}
                  onChange={(e) => setQueryDetails(e.target.value)}
                  placeholder="Explain what detail or document needs correction (e.g. Upload a clear, un-cropped copy of Aadhaar Card)..."
                  rows={4}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => setShowQueryModal(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
                disabled={!queryDetails.trim() || raiseQueryMutation.isPending}
                onClick={() => raiseQueryMutation.mutate()}
              >
                {raiseQueryMutation.isPending ? 'Submitting...' : 'Send Query to Applicant'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Reviewer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* Left-Side Category Navigation Buttons (3.5 cols) */}
        <div className="md:col-span-3 space-y-4 sticky top-20">
          <Card className="border border-slate-200/90 shadow-xs overflow-hidden bg-white">
            <div className="p-3.5 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Review Sections
              </span>
              <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded-full font-mono">
                {verifiedCount}/6 Verified
              </span>
            </div>

            <div className="p-2 space-y-1 bg-slate-50/40">
              {REVIEW_SECTIONS.map((sec) => {
                const isSelected = activeSection === sec.id
                let isVerified = false
                if (sec.id === 'field_visit') {
                  isVerified = isFieldVisitCompleted
                } else if (sec.checkKey) {
                  isVerified = verificationChecks[sec.checkKey]
                }
                const IconComponent = sec.icon

                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{sec.name}</span>
                    </div>
                    {sec.checkKey && (
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isVerified ? 'bg-emerald-400 ring-2 ring-emerald-200' : 'bg-slate-300'}`} title={isVerified ? 'Verified' : 'Pending Verification'} />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>

          {/* Reviewer Actions Card */}
          {isVerifierRole && (
            <Card className="border border-slate-200/80 p-3.5 bg-white space-y-2 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Verifier Actions</div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700 justify-start"
                onClick={() => {
                  const allVerified = {
                    kyc_verified: true,
                    residence_verified: true,
                    income_verified: true,
                    banking_verified: true,
                    family_verified: true,
                  }
                  updateVerificationMutation.mutate(allVerified)
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-2 shrink-0" /> Verify All 5 Categories
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold text-xs justify-start"
                onClick={() => setShowQueryModal(true)}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 mr-2 shrink-0" /> Raise Document Query
              </Button>
            </Card>
          )}
        </div>

        {/* Right Main Content Display Panel (8.5 cols) */}
        <div className="md:col-span-9 space-y-6">

          {/* SECTION 1: Applicant Profile & KYC */}
          {activeSection === 'kyc' && (
            <Card className={`border shadow-xs transition-all ${verificationChecks.kyc_verified ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}>
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-3.5 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      1. Applicant Profile & KYC Verification
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify Identity, Aadhaar, PAN, Live Photo & Personal Information
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={verificationChecks.kyc_verified ? 'success' : 'outline'} className="text-xs">
                  {verificationChecks.kyc_verified ? 'KYC Verified' : 'Pending Verification'}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <CategoryVerificationActionBar
                  catTitle="Applicant Identity & KYC"
                  isVerified={verificationChecks.kyc_verified}
                  onToggleVerify={() => handleToggleVerification('kyc_verified')}
                  onRaiseQuery={() => handleOpenQueryForCategory('Identity & Aadhaar Card')}
                  isVerifierRole={isVerifierRole}
                />

                {applicantPhotoUrl ? (
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 border border-slate-700/80">
                    <div className="flex items-center gap-4">
                      <div
                        className="relative group w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-md bg-slate-900 shrink-0 cursor-pointer"
                        onClick={() => setPreviewMedia({ url: applicantPhotoUrl, title: "Applicant Live Camera Photo" })}
                      >
                        <img src={applicantPhotoUrl} alt="Applicant Live Camera Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4 text-blue-300" /> View
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 bg-blue-500/30 text-blue-200 rounded-full border border-blue-400/30">
                          <Camera className="w-3.5 h-3.5 text-blue-300" /> Live Camera Photo (Verified Capture)
                        </div>
                        <h3 className="text-base font-extrabold text-white">
                          {applicant.first_name || app.first_name} {applicant.last_name || app.last_name}
                        </h3>
                        <p className="text-xs text-slate-300">
                          Facial identity photo captured live via device camera during form completion.
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setPreviewMedia({ url: applicantPhotoUrl, title: "Applicant Live Camera Photo" })}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 font-semibold text-xs gap-1.5 shadow-sm px-4"
                    >
                      <Eye className="w-4 h-4" /> Enlarge Camera Photo
                    </Button>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-xl text-xs flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No live camera photo captured for this applicant.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailFieldValue label="First Name" value={applicant.first_name || app.first_name} highlight />
                  <DetailFieldValue label="Last Name" value={applicant.last_name || app.last_name} highlight />
                  <DetailFieldValue label="Gender" value={applicant.gender || basic.gender} />
                  <DetailFieldValue label="Date of Birth" value={formatDate(applicant.dob || basic.dob)} />
                  <DetailFieldValue label="Marital Status" value={applicant.marital_status || basic.marital_status} />
                  <DetailFieldValue label="Husband / Spouse Name" value={applicant.husband_name || applicant.spouse_name || basic.husband_name} />
                  <DetailFieldValue label="Husband / Spouse Mobile" value={applicant.husband_phone || applicant.husband_mobile || basic.husband_phone} />
                  <DetailFieldValue label="Mobile Number" value={applicant.phone || app.phone} highlight />
                  <DetailFieldValue label="Email Address" value={applicant.email || app.email} />
                  <DetailFieldValue label="Education Level" value={basic.education || applicant.education} />
                  <DetailFieldValue label="Aadhaar Card No." value={kyc.aadhaar || kyc.aadhaar_number} highlight />
                  <DetailFieldValue label="PAN Card No." value={kyc.pan || kyc.pan_number} highlight />
                  <DetailFieldValue label="Voter ID No." value={kyc.voter_id} />
                  <DetailFieldValue label="Ration Card No." value={kyc.ration_card} />
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Submitted Document Photos & Attachments</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <DocumentPreviewCard title="Applicant Live Selfie Photo (Camera)" docVal={kycLiveSelfieUrl || applicantPhotoUrl} onPreview={setPreviewMedia} />
                    <DocumentPreviewCard title="Uploaded Profile Photo (Gallery/File)" docVal={uploadedProfilePhotoUrl} onPreview={setPreviewMedia} />
                    <DocumentPreviewCard title="Aadhaar Card Document" docVal={kyc.aadhaar_doc} onPreview={setPreviewMedia} />
                    <DocumentPreviewCard title="PAN Card Document" docVal={kyc.pan_doc} onPreview={setPreviewMedia} />
                    <DocumentPreviewCard title="Education Certificate" docVal={basic.education_doc} onPreview={setPreviewMedia} />
                    {kyc.voter_doc && <DocumentPreviewCard title="Voter ID Document" docVal={kyc.voter_doc} onPreview={setPreviewMedia} />}
                    {kyc.other_doc && <DocumentPreviewCard title="Other KYC Document" docVal={kyc.other_doc} onPreview={setPreviewMedia} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 2: Residence & Property */}
          {activeSection === 'residence' && (
            <Card className={`border shadow-xs transition-all ${verificationChecks.residence_verified ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}>
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-3.5 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      2. Residence Address & Property Verification
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify Residential Address, Pincode & Property Ownership
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={verificationChecks.residence_verified ? 'success' : 'outline'} className="text-xs">
                  {verificationChecks.residence_verified ? 'Address Verified' : 'Pending Verification'}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <CategoryVerificationActionBar
                  catTitle="Residence Address & Property"
                  isVerified={verificationChecks.residence_verified}
                  onToggleVerify={() => handleToggleVerification('residence_verified')}
                  onRaiseQuery={() => handleOpenQueryForCategory('Residence & Address Proof')}
                  isVerifierRole={isVerifierRole}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailFieldValue label="Residence Type" value={basic.residence_type} highlight />
                  <DetailFieldValue label="Residence Address" value={basic.residence_address || basic.address || applicant.address} />
                  <DetailFieldValue label="State" value={basic.residence_state || basic.state || applicant.residence_state} />
                  <DetailFieldValue label="City" value={basic.residence_city || basic.city || applicant.residence_city} />
                  <DetailFieldValue label="Pincode" value={basic.residence_pincode || basic.pincode || applicant.pincode} highlight />
                  <DetailFieldValue label="Permanent Address" value={basic.same_as_residence ? 'Same as Residence Address' : basic.permanent_address} />
                  <DetailFieldValue label="Property Value" value={property.property_value ? formatCurrency(property.property_value) : '—'} />
                  <DetailFieldValue label="Property Details" value={property.property_details || property.property_type} />
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Submitted Address & Property Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <DocumentPreviewCard title="Address Proof Document" docVal={basic.residence_proof || basic.address_proof_doc} onPreview={setPreviewMedia} />
                    <DocumentPreviewCard title="Property Document" docVal={property.property_documents || property.property_doc} onPreview={setPreviewMedia} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 3: Income & Salary */}
          {activeSection === 'income' && (
            <Card className={`border shadow-xs transition-all ${verificationChecks.income_verified ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}>
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-3.5 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      3. Income, Occupation & Salary Slip Verification
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify Employment, Salary Slips, Business Income & Obligations
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={verificationChecks.income_verified ? 'success' : 'outline'} className="text-xs">
                  {verificationChecks.income_verified ? 'Income Verified' : 'Pending Verification'}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <CategoryVerificationActionBar
                  catTitle="Income & Employment Details"
                  isVerified={verificationChecks.income_verified}
                  onToggleVerify={() => handleToggleVerification('income_verified')}
                  onRaiseQuery={() => handleOpenQueryForCategory('Income & Employment Details')}
                  isVerifierRole={isVerifierRole}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailFieldValue label="Employment Type" value={work.employment_type || income.employment_type} highlight />
                  <DetailFieldValue label="Employer / Company Name" value={work.employer || work.company_name || work.business_name} />
                  <DetailFieldValue label="Designation" value={work.designation} />
                  <DetailFieldValue label="Work Experience" value={work.years_in_job ? `${work.years_in_job} Years` : '—'} />
                  <DetailFieldValue label="Monthly Income / Salary" value={income.monthly_income || work.monthly_income ? formatCurrency(income.monthly_income || work.monthly_income) : '—'} highlight />
                  <DetailFieldValue label="Total Household Income" value={income.total_household_income ? formatCurrency(income.total_household_income) : '—'} highlight />
                  <DetailFieldValue label="Existing Monthly EMIs" value={obligations.existing_emis || obligations.total_monthly_emi ? formatCurrency(obligations.existing_emis || obligations.total_monthly_emi) : '—'} />
                  <DetailFieldValue label="Work Address" value={work.company_address || work.business_address || work.work_address} />
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Submitted Salary Slips & Income Proof Documents</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <DocumentPreviewCard title="Salary Slip / Income Certificate" docVal={work.employment_proof_doc || income.income_proof || work.salary_slip_doc} onPreview={setPreviewMedia} />
                    <DocumentPreviewCard
                      title="Bank Statement Document"
                      docVal={
                        work.bank_statement_doc ||
                        work.bank_statement ||
                        income.bank_statement_doc ||
                        income.bank_statement ||
                        banking.bank_statement_doc ||
                        banking.passbook_doc ||
                        banking.bank_passbook ||
                        kyc.bank_statement_doc
                      }
                      onPreview={setPreviewMedia}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 4: Banking & Passbook */}
          {activeSection === 'banking' && (
            <Card className={`border shadow-xs transition-all ${verificationChecks.banking_verified ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}>
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-3.5 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      4. Bank Account & Passbook Verification
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify Bank Account Number, IFSC Code & Passbook Attachments
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={verificationChecks.banking_verified ? 'success' : 'outline'} className="text-xs">
                  {verificationChecks.banking_verified ? 'Banking Verified' : 'Pending Verification'}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <CategoryVerificationActionBar
                  catTitle="Banking & Passbook"
                  isVerified={verificationChecks.banking_verified}
                  onToggleVerify={() => handleToggleVerification('banking_verified')}
                  onRaiseQuery={() => handleOpenQueryForCategory('Banking & Passbook')}
                  isVerifierRole={isVerifierRole}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailFieldValue label="Bank Name" value={banking.bank_name} highlight />
                  <DetailFieldValue label="Account Number" value={banking.account_number || banking.acc_no} highlight />
                  <DetailFieldValue label="Account Holder Name" value={banking.account_holder_name} />
                  <DetailFieldValue label="IFSC Code" value={banking.ifsc_code} highlight />
                  <DetailFieldValue label="Account Type" value={banking.account_type || 'Savings'} />
                  <DetailFieldValue label="Account Ownership" value={banking.account_ownership || 'Self'} />
                </div>

                <div className="pt-3 border-t border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Submitted Bank Passbook / Cheque / Bank Statement</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <DocumentPreviewCard
                      title="Bank Passbook / Cheque Copy"
                      docVal={
                        banking.passbook_doc ||
                        banking.cheque_doc ||
                        banking.bank_passbook ||
                        banking.bank_statement_doc ||
                        work.bank_statement_doc ||
                        income.bank_statement
                      }
                      onPreview={setPreviewMedia}
                    />
                    <DocumentPreviewCard
                      title="Bank Statement Document"
                      docVal={
                        banking.bank_statement_doc ||
                        work.bank_statement_doc ||
                        income.bank_statement_doc ||
                        income.bank_statement ||
                        banking.passbook_doc ||
                        kyc.bank_statement_doc
                      }
                      onPreview={setPreviewMedia}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION 5: Family & References */}
          {activeSection === 'family' && (
            <Card className={`border shadow-xs transition-all ${verificationChecks.family_verified ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'}`}>
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-3.5 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      5. Family Details & References Verification
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Verify Family Dependents, Nominee & Contact References
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={verificationChecks.family_verified ? 'success' : 'outline'} className="text-xs">
                  {verificationChecks.family_verified ? 'Family Verified' : 'Pending Verification'}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <CategoryVerificationActionBar
                  catTitle="Family Details & References"
                  isVerified={verificationChecks.family_verified}
                  onToggleVerify={() => handleToggleVerification('family_verified')}
                  onRaiseQuery={() => handleOpenQueryForCategory('Other Details / Documents')}
                  isVerifierRole={isVerifierRole}
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <DetailFieldValue label="Total Family Members" value={family.family_members} />
                  <DetailFieldValue label="Total Dependents" value={family.dependents} />
                  <DetailFieldValue label="Spouse / Nominee Name" value={family.nominee_name || family.spouse_name} />
                  <DetailFieldValue label="Nominee Relationship" value={family.nominee_relation} />
                  <DetailFieldValue label="Reference 1 Name" value={references.ref1_name || family.ref1_name} />
                  <DetailFieldValue label="Reference 1 Contact" value={references.ref1_phone || family.ref1_phone} />
                  <DetailFieldValue label="Reference 2 Name" value={references.ref2_name || family.ref2_name} />
                  <DetailFieldValue label="Reference 2 Contact" value={references.ref2_phone || family.ref2_phone} />
                </div>

                {Array.isArray(family.family_list) && family.family_list.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Submitted Family Members List</h4>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs">Relation</TableHead>
                            <TableHead className="text-xs">DOB / Age</TableHead>
                            <TableHead className="text-xs">Occupation</TableHead>
                            <TableHead className="text-xs">Monthly Income</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {family.family_list.map((m, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs font-semibold">{formatSafeValue(m.name)}</TableCell>
                              <TableCell className="text-xs">{formatSafeValue(m.relation)}</TableCell>
                              <TableCell className="text-xs">{formatSafeValue(m.dob)}</TableCell>
                              <TableCell className="text-xs">{formatSafeValue(m.occupation)}</TableCell>
                              <TableCell className="text-xs font-medium">{formatSafeValue(m.monthly_income)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECTION 6: Field Visit Verification */}
          {activeSection === 'field_visit' && (
            <Card className={`border shadow-xs transition-all ${isFieldVisitCompleted ? 'border-emerald-300 bg-emerald-50/20' : 'border-indigo-200'}`}>
              <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-3.5 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      6. Field Visit (FV) Verification & On-Site Audit
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Physical On-Site Verification with Live Camera Photo, GPS Geolocation & Physical Audit Checklist
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isFieldVisitCompleted ? 'success' : 'outline'} className="text-xs">
                  {isFieldVisitCompleted ? 'FV Report Completed' : 'Pending Field Visit'}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                {/* Assigned Field Verifier Banner Card */}
                <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-xl shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        Assigned Field Verifier / Collection Agent
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-mono">
                          Staff Assignment
                        </span>
                      </div>
                      {fieldVisitData.assigned_officer_name ? (
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{fieldVisitData.assigned_officer_name}</span>
                          <Badge variant="outline" className="text-[10px] capitalize bg-white text-indigo-800 border-indigo-300">
                            {fieldVisitData.assigned_officer_role?.replace('_', ' ') || 'Field Verifier / Collection Agent'}
                          </Badge>
                          {fieldVisitData.assigned_officer_phone && (
                            <span className="text-xs text-slate-600 font-medium">({fieldVisitData.assigned_officer_phone})</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>No Field Verifier assigned yet. Super Admin / Branch Admin / Team Leader needs to assign an officer.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdminRole && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-indigo-300 text-indigo-800 hover:bg-indigo-50 font-bold text-xs gap-1.5 shadow-2xs"
                      onClick={() => {
                        setSelectedOfficerId(fieldVisitData.assigned_officer_id || '')
                        setShowAssignModal(true)
                      }}
                    >
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                      {fieldVisitData.assigned_officer_name ? 'Re-Assign Officer' : 'Assign Field Verifier'}
                    </Button>
                  )}
                </div>

                <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                  isFieldVisitCompleted
                    ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-emerald-100/50 border-emerald-300 text-emerald-900'
                    : 'bg-gradient-to-r from-indigo-500/10 via-indigo-50 to-indigo-100/50 border-indigo-300 text-indigo-900'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg font-bold shrink-0 ${isFieldVisitCompleted ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
                      {isFieldVisitCompleted ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Field Visit Status
                      </div>
                      <div className="text-sm font-extrabold">
                        {isFieldVisitCompleted ? 'PHYSICAL FIELD VISIT COMPLETED & VERIFIED' : 'PENDING ON-SITE FIELD VISIT'}
                      </div>
                    </div>
                  </div>

                  {canPerformFieldVisit && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setFvLatitude(fieldVisitData.latitude || '')
                        setFvLongitude(fieldVisitData.longitude || '')
                        setFvLocationAddress(fieldVisitData.location_address || '')
                        setFvVisitPhotoUrl(fieldVisitData.visit_photo_url || '')
                        setFvRemarks(fieldVisitData.remarks || '')
                        setShowFieldVisitModal(true)
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {isFieldVisitCompleted ? 'UPDATE FIELD VISIT REPORT' : 'PERFORM FIELD VISIT NOW'}
                    </Button>
                  )}
                </div>

                {isFieldVisitCompleted || fieldVisitData.visit_photo_url ? (
                  <div className="space-y-5">
                    {/* Field Visit Featured Photo Card */}
                    {fieldVisitData.visit_photo_url && (
                      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 border border-indigo-800/80">
                        <div className="flex items-center gap-4">
                          <div
                            className="relative group w-28 h-28 rounded-2xl overflow-hidden border-2 border-indigo-400 shadow-md bg-slate-900 shrink-0 cursor-pointer"
                            onClick={() => setPreviewMedia({ url: fieldVisitData.visit_photo_url, title: "On-Site Field Visit Live Camera Photo" })}
                          >
                            <img src={fieldVisitData.visit_photo_url} alt="Field Visit Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                              <Eye className="w-4 h-4 text-indigo-300" /> View
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 rounded-full border border-indigo-400/30">
                              <Camera className="w-3.5 h-3.5 text-indigo-300" /> Field Visit Live Camera Photo
                            </div>
                            <h3 className="text-base font-extrabold text-white">
                              On-Site Physical Verification Photo
                            </h3>
                            <p className="text-xs text-indigo-200">
                              Captured live at applicant residence/business premises.
                            </p>
                            {fieldVisitData.verified_at && (
                              <p className="text-[11px] text-slate-400">
                                Verified At: {formatDateTime(fieldVisitData.verified_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setPreviewMedia({ url: fieldVisitData.visit_photo_url, title: "On-Site Field Visit Live Camera Photo" })}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 font-semibold text-xs gap-1.5 shadow-sm px-4"
                        >
                          <Eye className="w-4 h-4" /> Enlarge Visit Photo
                        </Button>
                      </div>
                    )}

                    {/* Geolocation & Audit Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <DetailFieldValue label="GPS Latitude" value={fieldVisitData.latitude} highlight />
                      <DetailFieldValue label="GPS Longitude" value={fieldVisitData.longitude} highlight />
                      <DetailFieldValue label="Physical Address Visited" value={fieldVisitData.location_address} highlight />
                    </div>

                    {/* Physical Checklist Summary */}
                    {fieldVisitData.checklist && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Field Officer Checklist Audit</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            {fieldVisitData.checklist.residence_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                            <span>Residence Verified & Matches Docs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {fieldVisitData.checklist.neighbor_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                            <span>Neighbor & Locality Reference Verified</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {fieldVisitData.checklist.income_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                            <span>Business Premises / Workplace Verified</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {fieldVisitData.checklist.applicant_met ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                            <span>Applicant Met In-Person</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Field Officer Remarks */}
                    {fieldVisitData.remarks && (
                      <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
                        <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">Field Officer Observations & Remarks</h4>
                        <p className="text-xs text-amber-900 font-medium leading-relaxed">{fieldVisitData.remarks}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-300 p-8 rounded-2xl text-center space-y-3">
                    <MapPin className="w-10 h-10 text-indigo-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">No Field Visit Recorded Yet</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Field Visit verification requires the Field Officer to visit the applicant's residence/business place, capture live camera photo and GPS location coordinates.
                      </p>
                    </div>
                    {canPerformFieldVisit && (
                      <Button
                        size="sm"
                        onClick={() => setShowFieldVisitModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-2 px-4 shadow-sm"
                      >
                        <Camera className="w-4 h-4" /> Start Field Visit Verification Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* SECTION: Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Loan Amount</div><div className="text-xl font-bold">{formatCurrency(app.approved_amount || app.loan_amount)}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Tenure</div><div className="text-xl font-bold">{app.tenure_months} months</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Interest Rate</div><div className="text-xl font-bold text-emerald-700">{app.interest_rate}% p.a.</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-sm text-gray-500">Monthly EMI</div><div className="text-xl font-bold">{formatCurrency(app.emi_amount)}</div></CardContent></Card>
              </div>

              {isAdminRole && (
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="border-blue-300 text-blue-800 hover:bg-blue-50 font-bold" onClick={openInterestModal}>
                    <Sliders className="w-4 h-4 mr-1 text-blue-600" /> Admin: Change Interest Rate & Loan Terms
                  </Button>
                </div>
              )}

              <Card>
                <CardHeader><CardTitle>Application Overview</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><span className="text-sm text-gray-500">Product</span><div className="font-medium">{app.product_name || '—'}</div></div>
                    <div><span className="text-sm text-gray-500">Customer Code</span><div className="font-medium">{app.customer_code || '—'}</div></div>
                    <div><span className="text-sm text-gray-500">Branch</span><div className="font-medium">{app.branch_name || '—'}</div></div>
                    <div><span className="text-sm text-gray-500">Area</span><div className="font-medium">{app.area_name || '—'}</div></div>
                    <div><span className="text-sm text-gray-500">Total Interest</span><div className="font-medium">{formatCurrency(app.total_interest)}</div></div>
                    <div><span className="text-sm text-gray-500">Total Payable</span><div className="font-medium">{formatCurrency(app.total_payable)}</div></div>
                    <div><span className="text-sm text-gray-500">Created</span><div className="font-medium">{formatDate(app.created_at)}</div></div>
                    <div><span className="text-sm text-gray-500">Reviewed</span><div className="font-medium">{formatDate(app.reviewed_at)}</div></div>
                  </div>
                </CardContent>
              </Card>
              {app.approved_by_name && (
                <Card>
                  <CardContent className="p-4">
                    <span className="text-sm text-gray-500">Approved by: </span>
                    <span className="font-medium">{app.approved_by_name}</span>
                    <span className="text-sm text-gray-500 ml-4">on {formatDate(app.approved_at)}</span>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* SECTION: Topic Matrix */}
          {activeSection === 'matrix' && (
            <Card>
              <CardHeader>
                <CardTitle>Application Progress Matrix</CardTitle>
                <CardDescription>{completedTopics}/16 topics completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {topics?.map((t) => (
                    <div key={t.id} className={`p-3 rounded-lg border ${t.is_completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="text-xs font-medium text-gray-500 mb-1">Topic {t.topic_number || ''}</div>
                      <div className="font-medium text-sm">{t.topic_name}</div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${t.is_completed ? 'bg-green-500' : 'bg-gray-400'}`} style={{ width: `${t.completion_pct || 0}%` }}></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{t.completion_pct || 0}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SECTION: Notes */}
          {activeSection === 'notes' && (
            <Card>
              <CardHeader><CardTitle>Notes & Audit Trail</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {notes?.length ? (
                    notes.map((note) => (
                      <div key={note.id} className={`p-4 rounded-lg border ${note.is_internal ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{note.first_name} {note.last_name}</span>
                            <Badge variant={note.is_internal ? 'secondary' : 'outline'}>{note.note_type}</Badge>
                            {note.is_internal && <span className="text-xs text-gray-400">Internal</span>}
                          </div>
                          <span className="text-xs text-gray-400">{formatDateTime(note.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{note.note_text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 py-8">No notes recorded yet</div>
                  )}
                </div>
                <div className="border-t pt-4 space-y-3">
                  <div className="flex gap-2">
                    <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="h-10 px-3 border rounded-md text-sm bg-white">
                      <option value="general">General</option>
                      <option value="review">Review</option>
                      <option value="query">Query</option>
                      <option value="approval">Approval</option>
                      <option value="external">External (Customer)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." className="flex-1" />
                    <Button onClick={submitNote} disabled={addNoteMutation.isPending || !noteText.trim()}>
                      <Send className="w-4 h-4 mr-1" />{addNoteMutation.isPending ? 'Sending...' : 'Add Note'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Lightbox Image / Document Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">{previewMedia.title || 'Document Preview'}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDocument(previewMedia.url, previewMedia.title)}
                  className="text-xs gap-1.5 border-slate-300"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Open Full Screen
                </Button>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 bg-slate-900/95 overflow-auto flex items-center justify-center min-h-[400px]">
              {previewMedia.url?.startsWith('data:image/') || /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(previewMedia.url) ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-xl"
                />
              ) : (
                <iframe
                  src={previewMedia.url}
                  title={previewMedia.title}
                  className="w-full h-[75vh] border-0 rounded-lg bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
