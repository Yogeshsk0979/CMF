import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { api, formatCurrency, formatDate } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Save, ArrowRight, ArrowLeft, CheckCircle2, Send, Camera, Info, Search, ChevronDown, Check, Upload, X, FileText, Plus, Trash2, Users, UserCheck, RefreshCw } from 'lucide-react'

function SearchableSelect({ options, value, onValueChange, placeholder = "Select option...", disabled = false }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  const filteredOptions = (options || []).filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen(!open)
            setSearch('')
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs border rounded-lg transition-all text-left ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : open
            ? 'bg-white text-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
            : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 shadow-2xs'
        }`}
      >
        <span className="truncate font-medium">
          {value || <span className="text-slate-400 font-normal">{placeholder}</span>}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-hidden flex flex-col">
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
          <div className="overflow-y-auto max-h-48 space-y-0.5 pt-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onValueChange(opt)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md transition-colors flex items-center justify-between ${
                    value === opt
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))
            ) : (
              <div className="text-xs text-slate-400 px-3 py-2 text-center">
                No matching options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FieldInfo({ text }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-blue-500 hover:text-blue-700 focus:outline-none transition-colors p-0.5 rounded-full inline-flex items-center justify-center bg-blue-50 border border-blue-200"
        title="More Information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute left-0 bottom-full mb-1.5 w-72 p-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none leading-relaxed border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
          <div className="font-medium text-slate-100 mb-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" /> Field Help & Guidelines
          </div>
          <div className="text-slate-300 font-normal">{text}</div>
        </div>
      )}
    </div>
  )
}

const TOPICS = [
  { code: 'applicant_details', name: 'Applicant Details' },
  { code: 'basic_details', name: 'Basic Details' },
  { code: 'kyc_details', name: 'KYC Details' },
  { code: 'work_details', name: 'Work Details' },
  { code: 'family_details', name: 'Family Details' },
  { code: 'banking_details', name: 'Banking Details' },
  { code: 'ratio_analysis', name: 'Ratio Analysis' },
  { code: 'obligations', name: 'Obligations' },
  { code: 'income_details', name: 'Income Details' },
  { code: 'customer_wealth', name: 'Customer Wealth' },
  { code: 'product_details', name: 'Product Details' },
  { code: 'property_details', name: 'Property Details' },
  { code: 'eligibility', name: 'Eligibility' },
]

export function getTopicCategoryVerified(topicCode, verificationChecks = {}) {
  if (!verificationChecks) return false
  if (['applicant_details', 'basic_details', 'kyc_details'].includes(topicCode)) {
    return !!verificationChecks.kyc_verified
  }
  if (['property_details', 'customer_wealth'].includes(topicCode)) {
    return !!verificationChecks.residence_verified
  }
  if (['work_details', 'income_details', 'obligations', 'ratio_analysis'].includes(topicCode)) {
    return !!verificationChecks.income_verified
  }
  if (['banking_details'].includes(topicCode)) {
    return !!verificationChecks.banking_verified
  }
  if (['family_details', 'family_references', 'product_details', 'eligibility'].includes(topicCode)) {
    return !!verificationChecks.family_verified
  }
  return false
}

export function CameraPhotoCapture({ photoUrl, onCapture, disabled = false }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [stream, setStream] = useState(null)
  const [facingMode, setFacingMode] = useState('user')
  const videoRef = useRef(null)

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }

  const startCamera = async (overrideFacingMode) => {
    if (disabled) return
    const targetFacing = overrideFacingMode || facingMode
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: targetFacing }
      })
      setStream(mediaStream)
      setIsCapturing(true)
    } catch (err) {
      toast.error('Unable to access camera: ' + (err.message || 'Permission denied'))
    }
  }

  const toggleCamera = () => {
    if (disabled) return
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    if (isCapturing) {
      startCamera(nextMode)
    }
  }

  useEffect(() => {
    if (isCapturing && videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [isCapturing, stream])

  const takePhoto = () => {
    if (!videoRef.current || disabled) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    onCapture(dataUrl)
    stopCamera()
    toast.success('Applicant live photo captured successfully!')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        {photoUrl ? (
          <div className="relative group w-36 h-36 rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm bg-slate-100 shrink-0">
            <img src={photoUrl} alt="Applicant Live Photo" className="w-full h-full object-cover" />
            {!disabled && (
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity p-2 gap-1.5">
                <Button type="button" size="xs" variant="destructive" onClick={() => onCapture('')} className="text-[11px] h-7 px-2">
                  Remove Photo
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="w-36 h-36 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0 p-2 text-center">
            <Camera className="w-8 h-8 mb-1 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500">
              {disabled ? 'Photo Locked (Verified)' : 'Live Camera Photo Required'}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1 min-w-[220px]">
          {disabled ? (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Live Photo Verified & Locked
              </span>
              <p className="text-[11px] text-emerald-700">
                This identity category has been verified. Camera photo retakes are locked.
              </p>
            </div>
          ) : !isCapturing ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => startCamera()}
                className="flex items-center justify-center gap-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 font-medium text-xs bg-white text-blue-700"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                {photoUrl ? 'Retake Live Photo (Camera)' : 'Open Camera to Capture Live Photo'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleCamera}
                title="Switch between Front (Selfie) and Back (Rear) Camera"
                className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 hover:bg-slate-100"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>{facingMode === 'user' ? 'Front (Selfie)' : 'Back (Rear)'}</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={takePhoto} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5">
                <Camera className="w-4 h-4" /> Snap Live Photo
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleCamera}
                className="flex items-center gap-1.5 text-xs border-slate-300 hover:bg-slate-100"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                Switch to {facingMode === 'user' ? 'Back' : 'Front'} Camera
              </Button>

              <Button type="button" variant="ghost" size="sm" onClick={stopCamera} className="text-slate-600 text-xs">
                Cancel
              </Button>
            </div>
          )}

          {!disabled && (
            <p className="text-[11px] text-amber-700 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
              ⚠️ Live photo capture from camera is mandatory. File uploads from gallery/URL are not allowed.
            </p>
          )}
        </div>
      </div>

      {isCapturing && !disabled && (
        <div className="relative w-full max-w-md rounded-xl overflow-hidden border-2 border-blue-500 shadow-xl bg-slate-900 mt-2">
          <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
          <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-[10px] text-slate-200 px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-blue-400" />
            Active: {facingMode === 'user' ? 'Front Camera (Selfie)' : 'Back Camera (Rear)'}
          </div>
          <div className="absolute bottom-3 left-3 right-3 text-center text-xs text-white bg-slate-900/80 backdrop-blur-xs py-1.5 px-3 rounded-lg border border-slate-700/50">
            📸 Position face clearly in camera frame and click <span className="font-bold text-emerald-400">Snap Live Photo</span>
          </div>
        </div>
      )}
    </div>
  )
}

function KycDocUploader({ label, value, onChange, accept = "image/*,application/pdf", disabled = false }) {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (disabled) return
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.')
      return
    }

    setLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      onChange({
        url: dataUrl,
        name: file.name,
        type: file.type.includes('pdf') || file.name.endsWith('.pdf') ? 'pdf' : 'image',
        size: file.size
      })
      setLoading(false)
      toast.success(`${label} uploaded successfully!`)
    }
    reader.onerror = () => {
      setLoading(false)
      toast.error('Failed to read file.')
    }
    reader.readAsDataURL(file)
  }

  const docObj = typeof value === 'string' && value 
    ? { url: value, type: value.includes('application/pdf') || value.endsWith('.pdf') ? 'pdf' : 'image', name: `${label} File` }
    : (value || null)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-slate-700 block">{label} (Photo / PDF)</Label>
        {docObj && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] font-semibold text-red-600 hover:underline flex items-center gap-0.5 select-none"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        )}
        {docObj && disabled && (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ✓ Verified & Locked
          </span>
        )}
      </div>

      {!docObj ? (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            disabled={disabled}
            className="hidden"
          />
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-medium ${
              disabled
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 cursor-pointer bg-white'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-600" />
            {disabled ? `Upload Locked (Section Verified)` : loading ? "Reading file..." : `Upload ${label} (Photo / PDF)`}
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 bg-white p-2 rounded-xl flex items-center gap-3 shadow-2xs">
          {docObj.type === 'pdf' ? (
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs shrink-0 border border-red-200 flex items-center justify-center">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
          ) : (
            <img
              src={docObj.url}
              alt={label}
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{docObj.name || label}</p>
            <p className="text-[10px] text-slate-500 uppercase font-medium">{docObj.type === 'pdf' ? 'PDF Document' : 'Photo Image'}</p>
          </div>
          <button
            type="button"
            onClick={() => handleViewDocument(docObj.url, label)}
            className="text-[11px] font-semibold text-blue-600 hover:underline px-2 py-0.5 bg-blue-50 rounded border border-blue-100"
          >
            View
          </button>
        </div>
      )}
    </div>
  )
}

function TimelineStepper({ topics, currentTopic, topicData, formData = {}, onSelectTopic }) {
  const verificationChecks = topicData.verification_checks || {}
  const completedCount = topics.filter(
    (t) => topicData[t.code] && Object.keys(topicData[t.code] || {}).length > 0
  ).length
  const progressPct = Math.round((completedCount / topics.length) * 100)

  return (
    <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
      <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold text-blue-400 text-xs">
            {currentTopic + 1}
          </div>
          <div>
            <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-200">
              Application Workflow Timeline
            </h3>
            <p className="text-xs text-slate-400">
              {completedCount} of {topics.length} sections completed ({progressPct}%)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700 hidden sm:block">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/50">
            {progressPct}% Done
          </span>
        </div>
      </div>

      <CardContent className="p-3.5 bg-slate-50/60">
        <div className="flex flex-wrap items-center gap-2">
          {topics.map((topic, i) => {
            const isVerified = getTopicCategoryVerified(topic.code, verificationChecks)
            const isFilled =
              (!!topicData[topic.code] && Object.keys(topicData[topic.code] || {}).length > 0) ||
              (topic.code === 'product_details' && (!!formData.product_id || !!formData.loan_amount))
            const isActive = i === currentTopic

            return (
              <button
                key={topic.code}
                type="button"
                onClick={() => onSelectTopic(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20 font-semibold'
                    : isVerified
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-2xs'
                    : isFilled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/90 shadow-2xs font-medium'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : isVerified
                      ? 'bg-emerald-700 text-white'
                      : isFilled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {isVerified ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-white'}`} />
                  ) : isFilled ? (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-white'}`} />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="whitespace-nowrap">{topic.name}</span>
                {isVerified && (
                  <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded-full font-bold uppercase ml-0.5">
                    Verified
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function calculateAge(dobString) {
  if (!dobString) return null
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

function getMaxDobDate() {
  const today = new Date()
  const year = today.getFullYear() - 18
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const INDIAN_STATES_CITIES = {
  "Karnataka": ["Bangalore", "Mysore", "Hubli-Dharwad", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Shimoga", "Tumkur", "Other"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Navi Mumbai", "Other"],
  "Tamil Nadu": [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kanchipuram",
    "Kanyakumari (Nagercoil)",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris (Ooty)",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi (Tuticorin)",
    "Tiruchirappalli (Trichy)",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar",
    "Other Tamil Nadu City"
  ],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Other"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Rajahmundry", "Tirupati", "Other"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Kannur", "Other"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi", "Other"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Other"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol", "Bardhaman", "Other"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Noida", "Ghaziabad", "Prayagraj", "Bareilly", "Other"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Other"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Other"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Other"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Other"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Other"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Other"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Other"],
  "Other State / UT": ["Other"]
}

function hasPincodeInAddress(addressStr) {
  if (!addressStr || typeof addressStr !== 'string') return false
  return /\b[1-9][0-9]{5}\b/.test(addressStr.trim())
}

export default function ApplicationForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: routeAppId } = useParams()
  const [currentTopic, setCurrentTopic] = useState(0)
  const [appId, setAppId] = useState(routeAppId || null)
  const [topicData, setTopicData] = useState({})
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    branch_id: '',
    area_id: '',
    loan_amount: '',
    tenure_months: 12,
    interest_rate: 14,
  })

  const { data: existingApp } = useQuery({
    queryKey: ['application-edit', routeAppId],
    queryFn: async () => (await api.get(`/applications/${routeAppId}`)).data,
    enabled: !!routeAppId,
  })

  const { data: existingTopics } = useQuery({
    queryKey: ['application-topics-edit', routeAppId],
    queryFn: async () => (await api.get(`/applications/${routeAppId}/topics`)).data,
    enabled: !!routeAppId,
  })

  useEffect(() => {
    if (routeAppId) {
      setAppId(routeAppId)
    }
  }, [routeAppId])

  useEffect(() => {
    if (existingApp) {
      setFormData(prev => ({
        ...prev,
        customer_id: existingApp.customer_id || prev.customer_id,
        product_id: existingApp.product_id || prev.product_id,
        branch_id: existingApp.branch_id || prev.branch_id,
        area_id: existingApp.area_id || prev.area_id,
        loan_amount: existingApp.loan_amount || prev.loan_amount,
        tenure_months: existingApp.tenure_months || prev.tenure_months,
        interest_rate: existingApp.interest_rate || prev.interest_rate,
      }))
    }
  }, [existingApp])

  useEffect(() => {
    if (existingTopics && existingTopics.length > 0) {
      const topicMap = {}
      existingTopics.forEach(t => {
        topicMap[t.topic_code] = t.topic_data || {}
      })
      setTopicData(prev => ({ ...prev, ...topicMap }))
    }
  }, [existingTopics])

  const { data: products } = useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => (await api.get('/settings/products')).data,
  })

  const { data: areas } = useQuery({
    queryKey: ['areas-list'],
    queryFn: async () => (await api.get('/areas')).data,
  })

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => (await api.get('/settings/branches')).data,
  })

  const { data: emiCalc } = useQuery({
    queryKey: ['emi-calc', formData.loan_amount, formData.interest_rate, formData.tenure_months],
    queryFn: async () => {
      if (!formData.loan_amount) return null
      return (await api.post('/disbursements/calculate-emi', {
        principal: parseFloat(formData.loan_amount) || 0,
        rate: parseFloat(formData.interest_rate),
        months: parseInt(formData.tenure_months),
      })).data
    },
    enabled: !!formData.loan_amount && !!formData.interest_rate && !!formData.tenure_months,
  })

  const { data: charges } = useQuery({
    queryKey: ['charges-calc', formData.loan_amount, formData.product_id],
    queryFn: async () => {
      if (!formData.loan_amount || !formData.product_id) return null
      return (await api.post('/disbursements/calculate-charges', {
        loan_amount: parseFloat(formData.loan_amount) || 0,
        product_id: formData.product_id,
      })).data
    },
    enabled: !!formData.loan_amount && !!formData.product_id,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/applications', {
        ...formData,
        customer_id: user?.role === 'customer' ? user.id : (formData.customer_id || user.id),
        loan_amount: parseFloat(formData.loan_amount) || null,
        tenure_months: parseInt(formData.tenure_months) || null,
        interest_rate: parseFloat(formData.interest_rate) || null,
        emi_amount: emiCalc?.emi || null,
        created_by: user.id,
        status: 'draft',
      })
      return res.data
    },
    onSuccess: (data) => {
      setAppId(data.id)
    },
  })

  const updateTopicMutation = useMutation({
    mutationFn: async ({ appId: customAppId, topicCode, data }) => {
      const targetId = customAppId || appId
      if (!targetId) throw new Error('Application ID is missing')
      await api.put(`/applications/${targetId}/topics/${topicCode}`, {
        data,
        is_completed: true,
        completion_pct: 100,
      })
    },
    onSuccess: () => {
      toast.success(`${TOPICS[currentTopic]?.name || 'Section'} saved`)
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Failed to save section')
    },
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/applications/${appId}/submit`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Application submitted for review!')
      navigate('/applications')
    },
  })

  function validateCurrentTopic() {
    const topic = TOPICS[currentTopic]
    const currentData = topicData[topic.code] || {}

    const gender = currentData.gender || topicData.applicant_details?.gender || topicData.basic_details?.gender
    const maritalStatus = currentData.marital_status || topicData.applicant_details?.marital_status || topicData.basic_details?.marital_status
    const husbandName = currentData.husband_name || topicData.applicant_details?.husband_name || topicData.basic_details?.husband_name || currentData.spouse_name || topicData.applicant_details?.spouse_name || topicData.basic_details?.spouse_name
    const husbandPhone = currentData.husband_phone || topicData.applicant_details?.husband_phone || topicData.basic_details?.husband_phone || currentData.husband_mobile || topicData.applicant_details?.husband_mobile || topicData.basic_details?.husband_mobile

    if (topic.code === 'applicant_details') {
      if (!currentData.first_name || !currentData.first_name.trim()) {
        toast.error('First Name is mandatory.')
        return false
      }
      if (!currentData.last_name || !currentData.last_name.trim()) {
        toast.error('Last Name is mandatory.')
        return false
      }
      if (!currentData.email || !currentData.email.trim()) {
        toast.error('Email is mandatory.')
        return false
      }
      if (!currentData.phone || !currentData.phone.trim()) {
        toast.error('Mobile Number is mandatory.')
        return false
      }
      if (!currentData.dob) {
        toast.error('Date of Birth is mandatory.')
        return false
      }
    }

    if (topic.code === 'applicant_details' || topic.code === 'basic_details') {
      const resAddr = currentData.residence_address || currentData.address || ''
      const permAddr = currentData.permanent_address || ''
      const resState = currentData.residence_state || currentData.state || ''
      const resCity = currentData.residence_city || currentData.city || ''
      const resPin = (currentData.residence_pincode || currentData.pincode || '').toString().trim()
      const permState = currentData.permanent_state || ''
      const permCity = currentData.permanent_city || ''
      const permPin = (currentData.permanent_pincode || '').toString().trim()

      if (hasPincodeInAddress(resAddr)) {
        toast.error('Pincode detected in Residence Address text box! Please remove the pincode from the address text and enter it in the separate PIN Code field.')
        return false
      }

      if (!currentData.same_as_residence && hasPincodeInAddress(permAddr)) {
        toast.error('Pincode detected in Permanent Address text box! Please remove the pincode from the address text and enter it in the separate PIN Code field.')
        return false
      }

      if (resAddr.trim() && resAddr.trim().length < 3) {
        toast.error(`Residence Address must be at least 3 characters long (Current length: ${resAddr.trim().length} chars).`)
        return false
      }
      if (resAddr.trim().length > 250) {
        toast.error('Residence Address cannot exceed 250 characters.')
        return false
      }

      if (resState && !resCity) {
        toast.error('Please select Residence City.')
        return false
      }

      if (resPin && resPin.length !== 6) {
        toast.error(`Residence PIN Code must be exactly 6 digits (Current length: ${resPin.length} digits).`)
        return false
      }

      if (!currentData.same_as_residence && permAddr.trim()) {
        if (permAddr.trim().length < 3) {
          toast.error(`Permanent Address must be at least 3 characters long (Current length: ${permAddr.trim().length} chars).`)
          return false
        }
        if (permAddr.trim().length > 250) {
          toast.error('Permanent Address cannot exceed 250 characters.')
          return false
        }
      }

      if (!currentData.same_as_residence) {
        if (permState && !permCity) {
          toast.error('Please select Permanent City.')
          return false
        }
        if (permPin && permPin.length !== 6) {
          toast.error(`Permanent PIN Code must be exactly 6 digits (Current length: ${permPin.length} digits).`)
          return false
        }
      }

      if (currentData.dob) {
        const age = calculateAge(currentData.dob)
        if (age !== null && age < 18) {
          toast.error(`Applicant must be at least 18 years old (Current age: ${age})`)
          return false
        }
      }

      if (gender === 'female' && maritalStatus === 'married') {
        if (!husbandName || !husbandName.trim()) {
          toast.error("Husband's name is mandatory for married female applicants.")
          return false
        }
        if (!husbandPhone || !husbandPhone.trim()) {
          toast.error("Husband's mobile number is mandatory for married female applicants.")
          return false
        }
      }
    }

    if (topic.code === 'banking_details') {
      const accNum = (currentData.account_number || '').trim()
      const confirmAccNum = (currentData.confirm_account_number || '').trim()
      const ifsc = (currentData.ifsc_code || '').trim()

      if (accNum && confirmAccNum && accNum !== confirmAccNum) {
        toast.error('Bank Account Number and Confirm Account Number do not match!')
        return false
      }
      if (accNum && (accNum.length < 9 || accNum.length > 18)) {
        toast.error('Bank Account Number must be between 9 and 18 digits.')
        return false
      }
      if (ifsc && ifsc.length !== 11) {
        toast.error('IFSC Code must be exactly 11 characters (e.g. SBIN0001234).')
        return false
      }
    }

    if (topic.code === 'product_details') {
      if (!formData.product_id) {
        toast.error('Please select a Loan Product / Purpose.')
        return false
      }
      if ((formData.product_id === 'others' || formData.loan_purpose_category === 'others') && (!formData.other_loan_purpose || !formData.other_loan_purpose.trim())) {
        toast.error('Please specify details for Custom Loan Purpose.')
        return false
      }
      if (!formData.loan_amount || parseFloat(formData.loan_amount) <= 0) {
        toast.error('Please enter a valid Loan Amount.')
        return false
      }
    }

    if (topic.code === 'kyc_details') {
      const aadhaarVal = (currentData.aadhaar || '').toString().trim()
      const panVal = (currentData.pan || '').toString().trim()
      const cleanAadhaar = aadhaarVal.replace(/\s/g, '')
      const isAadhaarValid = cleanAadhaar.length === 12 && /^\d{12}$/.test(cleanAadhaar)
      const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panVal.toUpperCase())

      if (!aadhaarVal) {
        toast.error('Aadhaar Card Number is mandatory.')
        return false
      }
      if (!isAadhaarValid) {
        toast.error('Aadhaar Card Number must be 12 numeric digits.')
        return false
      }
      if (!currentData.aadhaar_doc) {
        toast.error('Please upload Aadhaar Card document (Photo or PDF).')
        return false
      }
      if (!panVal) {
        toast.error('PAN Card Number is mandatory.')
        return false
      }
      if (!isPanValid) {
        toast.error('PAN Card Number format is invalid (Must be 10 characters, e.g. ABCDE1234F).')
        return false
      }
      if (!currentData.pan_doc) {
        toast.error('Please upload PAN Card document (Photo or PDF).')
        return false
      }
    }

    if (topic.code === 'family_details' || topic.code === 'family_references') {
      const familyMembers = currentData.family_members || []
      if (familyMembers.length === 0 || !familyMembers[0]?.name || !familyMembers[0]?.name.trim()) {
        toast.error('At least 1 Family Member Name is mandatory.')
        return false
      }
      if (!familyMembers[0]?.relation) {
        toast.error('Relation Type for Family Member #1 is mandatory.')
        return false
      }

      for (let i = 1; i < familyMembers.length; i++) {
        const member = familyMembers[i]
        if (member.name && member.name.trim() && !member.relation) {
          toast.error(`Please select Relation Type for Family Member #${i + 1} (${member.name}).`)
          return false
        }
      }
    }

    return true
  }

  async function handleNext() {
    const topic = TOPICS[currentTopic]
    const isCategoryVerified = getTopicCategoryVerified(topic.code, topicData.verification_checks)

    if (isCategoryVerified) {
      if (currentTopic < TOPICS.length - 1) {
        setCurrentTopic(currentTopic + 1)
      }
      return
    }

    if (!validateCurrentTopic()) return

    let activeAppId = appId
    if (!activeAppId) {
      try {
        const created = await createMutation.mutateAsync()
        activeAppId = created.id
        setAppId(created.id)
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to initialize application draft')
        return
      }
    }

    const payloadData = topic.code === 'product_details'
      ? { ...formData, ...(topicData[topic.code] || {}) }
      : (topicData[topic.code] || {})

    try {
      await updateTopicMutation.mutateAsync({
        appId: activeAppId,
        topicCode: topic.code,
        data: payloadData,
      })
      setTopicData((prev) => ({
        ...prev,
        [topic.code]: payloadData,
      }))
      if (currentTopic < TOPICS.length - 1) {
        setCurrentTopic(currentTopic + 1)
      }
    } catch (err) {
      // Error handled by updateTopicMutation onError
    }
  }

  function handlePrev() {
    if (currentTopic > 0) setCurrentTopic(currentTopic - 1)
  }

  function updateField(topicCode, field, value) {
    setTopicData((prev) => {
      const updated = {
        ...prev,
        [topicCode]: { ...(prev[topicCode] || {}), [field]: value },
      }
      // If photo_url or profile_photo or live_selfie_url is updated, set photo_url on topicData
      if (['profile_photo', 'live_selfie_url'].includes(field) && value) {
        const photoStr = typeof value === 'object' && value ? (value.url || value) : value
        if (photoStr) {
          updated[topicCode].photo_url = photoStr
        }
      }
      // Keep applicant_details and basic_details synced for gender, marital_status, husband_name/spouse_name, and husband_phone
      if (['gender', 'marital_status', 'husband_name', 'spouse_name', 'husband_phone', 'husband_mobile'].includes(field)) {
        if (topicCode === 'applicant_details' && prev.basic_details) {
          updated.basic_details = { ...(prev.basic_details || {}), [field]: value }
        } else if (topicCode === 'basic_details' && prev.applicant_details) {
          updated.applicant_details = { ...(prev.applicant_details || {}), [field]: value }
        }
      }
      return updated
    })
  }

  const topic = TOPICS[currentTopic]
  const data = topicData[topic.code] || {}
  const completedCount = Object.keys(topicData).filter((k) => Object.keys(topicData[k] || {}).length > 0).length

  function renderTopicContent() {
    const isCategoryVerified = getTopicCategoryVerified(topic.code, topicData.verification_checks)

    return (
      <div className="space-y-4">
        {isCategoryVerified && (
          <div className="p-4 rounded-xl bg-emerald-700 text-white shadow-md flex items-center justify-between gap-3 border-2 border-emerald-500 mb-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg shrink-0">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider">
                    🔒 Category Verified by Branch / Super Admin
                  </h4>
                  <span className="text-[10px] font-extrabold bg-white text-emerald-800 px-2.5 py-0.5 rounded-full uppercase">
                    VERIFIED & LOCKED
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                  This section has been audited and verified by the branch/super admin. Editing field values, camera photos, and document uploads is locked for verified categories.
                </p>
              </div>
            </div>
          </div>
        )}

        <fieldset disabled={isCategoryVerified} className="space-y-4">
          {renderTopicInnerContent(isCategoryVerified)}
        </fieldset>
      </div>
    )
  }

  function renderTopicInnerContent(isCategoryVerified = false) {
    switch (topic.code) {
      case 'applicant_details': {
        const applicantAge = calculateAge(data.dob)
        const isUnderage = applicantAge !== null && applicantAge < 18
        const currentGender = data.gender || topicData.basic_details?.gender
        const currentMaritalStatus = data.marital_status || topicData.basic_details?.marital_status
        const isFemaleMarried = currentGender === 'female' && currentMaritalStatus === 'married'
        const husbandVal = data.husband_name || data.spouse_name || ''
        const husbandPhoneVal = data.husband_phone || data.husband_mobile || ''

        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-medium flex items-center gap-1">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={data.first_name || ''}
                onChange={(e) => updateField(topic.code, 'first_name', e.target.value)}
                placeholder="Enter First Name"
              />
            </div>
            <div>
              <Label className="font-medium flex items-center gap-1">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={data.last_name || ''}
                onChange={(e) => updateField(topic.code, 'last_name', e.target.value)}
                placeholder="Enter Last Name"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="font-medium flex items-center gap-1">
                  DOB (Date of Birth) <span className="text-red-500">*</span>
                </Label>
                {data.dob && (
                  <span className={`text-xs font-semibold ${isUnderage ? 'text-red-600' : 'text-emerald-600'}`}>
                    {isUnderage ? `Age: ${applicantAge} yrs (Under 18)` : `Age: ${applicantAge} yrs`}
                  </span>
                )}
              </div>
              <Input
                type="date"
                max={getMaxDobDate()}
                value={data.dob || ''}
                onChange={(e) => updateField(topic.code, 'dob', e.target.value)}
                className={isUnderage ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}
              />
              {isUnderage && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Applicant must be at least 18 years old to apply.
                </p>
              )}
            </div>
            <div><Label>Gender</Label>
              <Select value={data.gender || ''} onValueChange={(v) => updateField(topic.code, 'gender', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Marital Status</Label>
              <Select value={data.marital_status || ''} onValueChange={(v) => updateField(topic.code, 'marital_status', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem><SelectItem value="widowed">Widowed</SelectItem><SelectItem value="divorced">Divorced</SelectItem></SelectContent>
              </Select>
            </div>
            {isFemaleMarried && (
              <>
                <div>
                  <Label className="text-red-600 font-medium flex items-center gap-1">
                    Husband's Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={husbandVal}
                    placeholder="Enter Husband's Full Name"
                    onChange={(e) => {
                      updateField(topic.code, 'husband_name', e.target.value)
                      updateField(topic.code, 'spouse_name', e.target.value)
                    }}
                    className={!husbandVal.trim() ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}
                  />
                  {!husbandVal.trim() && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Husband's name is mandatory for married female applicants.
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-red-600 font-medium flex items-center gap-1">
                    Husband's Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    value={husbandPhoneVal}
                    placeholder="Enter 10-digit Mobile Number"
                    onChange={(e) => {
                      updateField(topic.code, 'husband_phone', e.target.value)
                      updateField(topic.code, 'husband_mobile', e.target.value)
                    }}
                    className={!husbandPhoneVal.trim() ? 'border-red-500 bg-red-50 focus:ring-red-500' : ''}
                  />
                  {!husbandPhoneVal.trim() && (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      Husband's mobile number is mandatory for married female applicants.
                    </p>
                  )}
                </div>
              </>
            )}
            <div>
              <Label className="font-medium flex items-center gap-1">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                value={data.email || ''}
                onChange={(e) => updateField(topic.code, 'email', e.target.value)}
                placeholder="applicant@example.com"
              />
            </div>
            <div>
              <Label className="font-medium flex items-center gap-1">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                value={data.phone || ''}
                onChange={(e) => updateField(topic.code, 'phone', e.target.value)}
                placeholder="10-digit Mobile Number"
              />
            </div>
            <div className="col-span-2 space-y-3 bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-slate-900 flex items-center gap-1">
                  Residence Address (Current Address)
                  <FieldInfo text="Door/Flat No, Street, Area, Landmark. Select State, City & PIN code separately." />
                </Label>
                <div className="flex items-center gap-2">
                  {hasPincodeInAddress(data.address || data.residence_address) && (
                    <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                      ⚠️ Remove 6-digit pincode from address box
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold ${(data.address || data.residence_address || '').trim().length > 240 ? 'text-red-600' : 'text-slate-500'}`}>
                    {(data.address || data.residence_address || '').trim().length}/250 chars
                  </span>
                </div>
              </div>

              {/* 1. Address Line */}
              <div>
                <Label className="text-xs text-slate-600 mb-1 block font-medium">1. Address Line (Door/Flat No, Street, Area, Landmark)</Label>
                <Textarea
                  value={data.address || data.residence_address || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateField(topic.code, 'address', val)
                    updateField(topic.code, 'residence_address', val)
                  }}
                  rows={1}
                  maxLength={250}
                  placeholder="Door/Flat No, Street, Building, Area, Landmark"
                  className={`h-10 text-xs py-2 ${hasPincodeInAddress(data.address || data.residence_address) ? "border-red-500 bg-red-50/40 focus:ring-red-500" : "bg-white"}`}
                />
                {hasPincodeInAddress(data.address || data.residence_address) && (
                  <p className="text-xs font-medium text-red-600 mt-1">
                    ❌ Pincode detected in address box! Please remove the pincode from this text box and enter it in the separate PIN Code field below.
                  </p>
                )}
              </div>

              {/* State, City, PIN Code Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <Label className="font-medium text-xs text-slate-700 mb-1 block">2. State</Label>
                  <SearchableSelect
                    options={Object.keys(INDIAN_STATES_CITIES)}
                    value={data.residence_state || data.state || ''}
                    placeholder="Search & Select State..."
                    onValueChange={(v) => {
                      updateField(topic.code, 'residence_state', v)
                      updateField(topic.code, 'state', v)
                      updateField(topic.code, 'residence_city', '')
                      updateField(topic.code, 'city', '')
                    }}
                  />
                </div>

                <div>
                  <Label className="font-medium text-xs text-slate-700 mb-1 block">3. City</Label>
                  <SearchableSelect
                    options={INDIAN_STATES_CITIES[data.residence_state || data.state] || ["Other"]}
                    value={data.residence_city || data.city || ''}
                    placeholder={(data.residence_state || data.state) ? "Search & Select City..." : "Select State First"}
                    disabled={!(data.residence_state || data.state)}
                    onValueChange={(v) => {
                      updateField(topic.code, 'residence_city', v)
                      updateField(topic.code, 'city', v)
                    }}
                  />
                  {(data.residence_state || data.state) && !(data.residence_city || data.city) && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1">⚠️ City selection required</p>
                  )}
                </div>

                <div>
                  <Label className="font-medium text-xs text-slate-700 mb-1 block">4. PIN Code <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    maxLength={6}
                    value={data.pincode || data.residence_pincode || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                      updateField(topic.code, 'pincode', val)
                      updateField(topic.code, 'residence_pincode', val)
                    }}
                    placeholder="6-digit PIN Code"
                    className={`text-xs h-9 ${(data.pincode || data.residence_pincode || '').length > 0 && (data.pincode || data.residence_pincode || '').length < 6 ? "border-amber-500 bg-amber-50/40 focus:ring-amber-500" : "bg-white"}`}
                  />
                  {(data.pincode || data.residence_pincode || '').length > 0 && (data.pincode || data.residence_pincode || '').length < 6 && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1">
                      ⚠️ PIN Code must be 6 digits (currently {(data.pincode || data.residence_pincode || '').length}/6)
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="col-span-2 border-t pt-4 mt-1">
              <Label className="block mb-2 font-medium text-slate-900">
                Applicant Profile Photo <span className="text-slate-500 font-normal text-xs">(Upload from Device Gallery / Files)</span>
              </Label>
              <KycDocUploader
                label="Applicant Profile Photo"
                accept="image/*"
                value={data.profile_photo || data.photo_url}
                disabled={isCategoryVerified}
                onChange={(val) => {
                  const url = typeof val === 'object' && val ? val.url : val
                  updateField(topic.code, 'profile_photo', val)
                  updateField(topic.code, 'photo_url', url)
                }}
              />
              <p className="text-[11px] text-slate-500 mt-1">Select applicant photo from device gallery or files (JPG, PNG)</p>
            </div>
          </div>
        )
      }
      case 'basic_details':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label>Education Level</Label>
                <FieldInfo text="Education Classification: Primary = Upto 10th Standard | Secondary = 12th / Diploma | Graduate = UG (Bachelor's Degree) | Post Graduate = PG (Master's / Ph.D.)" />
              </div>
              <Select value={data.education} onValueChange={(v) => updateField(topic.code, 'education', v)}>
                <SelectTrigger><SelectValue placeholder="Select Education" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (No Formal Schooling)</SelectItem>
                  <SelectItem value="primary">Primary (Upto 10th Standard)</SelectItem>
                  <SelectItem value="secondary">Secondary (12th / Diploma)</SelectItem>
                  <SelectItem value="graduate">Graduate (UG / Bachelor's Degree)</SelectItem>
                  <SelectItem value="post_graduate">Post Graduate (PG / Master's / Ph.D.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <KycDocUploader
                label={
                  data.education === 'primary'
                    ? '10th Marksheet / School Leaving Certificate'
                    : data.education === 'secondary'
                    ? '12th Marksheet / Diploma Certificate'
                    : data.education === 'graduate'
                    ? 'Degree Certificate / UG Consolidated Marksheet'
                    : data.education === 'post_graduate'
                    ? 'PG Degree Certificate / Master\'s Marksheet'
                    : 'Educational Qualification Certificate'
                }
                value={data.education_doc}
                disabled={isCategoryVerified}
                onChange={(val) => updateField(topic.code, 'education_doc', val)}
              />
              <p className="text-[11px] text-slate-500 mt-1">Optional field: Upload photo or PDF of educational certificate / marksheet matching your qualification</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label>Residence Type</Label>
                <FieldInfo text="Owned = Self/Spouse owned property | Rented = Living on lease/rent | Family = Parent or ancestral family home" />
              </div>
              <Select value={data.residence_type} onValueChange={(v) => updateField(topic.code, 'residence_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select Residence Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Owned Property</SelectItem>
                  <SelectItem value="rented">Rented Accommodation</SelectItem>
                  <SelectItem value="family">Family / Ancestral Home</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Addresses Section */}
            <div className="col-span-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-4 mt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  🏠 Applicant Addresses & Location Details
                </h4>
                <span className="text-[11px] text-slate-500 font-medium">Do not include 6-digit pincode in address line text</span>
              </div>

              {/* 1. Residence Address */}
              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-slate-900">1. Residence Address (Current Address)</Label>
                  <div className="flex items-center gap-2">
                    {hasPincodeInAddress(data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address) && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                        ⚠️ Remove 6-digit pincode from address box
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold ${(data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address || '').trim().length > 240 ? 'text-red-600' : 'text-slate-500'}`}>
                      {(data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address || '').trim().length}/250 chars
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-600 mb-1 block font-medium">1. Address Line (Door/Flat No, Street, Area, Landmark)</Label>
                  <Textarea
                    value={data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      updateField(topic.code, 'residence_address', val)
                      updateField(topic.code, 'correspondence_address', val)
                      updateField(topic.code, 'address', val)
                      if (data.same_as_residence) {
                        updateField(topic.code, 'permanent_address', val)
                      }
                    }}
                    rows={1}
                    maxLength={250}
                    placeholder="Door/Flat No, Street, Building, Area, Landmark"
                    className={`h-10 text-xs py-2 ${hasPincodeInAddress(data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address) ? "border-red-500 bg-red-50/40 focus:ring-red-500" : "bg-white"}`}
                  />
                  {hasPincodeInAddress(data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address) && (
                    <p className="text-xs font-medium text-red-600 mt-1">
                      ❌ Pincode detected in address box! Please remove the pincode from this text box and enter it in the separate PIN Code field below.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <Label className="font-medium text-xs text-slate-700 mb-1 block">2. State</Label>
                    <SearchableSelect
                      options={Object.keys(INDIAN_STATES_CITIES)}
                      value={data.residence_state || data.state || topicData.applicant_details?.residence_state || ''}
                      placeholder="Search & Select State..."
                      onValueChange={(v) => {
                        updateField(topic.code, 'residence_state', v)
                        updateField(topic.code, 'state', v)
                        updateField(topic.code, 'residence_city', '')
                        updateField(topic.code, 'city', '')
                        if (data.same_as_residence) {
                          updateField(topic.code, 'permanent_state', v)
                          updateField(topic.code, 'permanent_city', '')
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label className="font-medium text-xs text-slate-700 mb-1 block">3. City</Label>
                    <SearchableSelect
                      options={INDIAN_STATES_CITIES[data.residence_state || data.state || topicData.applicant_details?.residence_state] || ["Other"]}
                      value={data.residence_city || data.city || topicData.applicant_details?.residence_city || ''}
                      placeholder={(data.residence_state || data.state || topicData.applicant_details?.residence_state) ? "Search & Select City..." : "Select State First"}
                      disabled={!(data.residence_state || data.state || topicData.applicant_details?.residence_state)}
                      onValueChange={(v) => {
                        updateField(topic.code, 'residence_city', v)
                        updateField(topic.code, 'city', v)
                        if (data.same_as_residence) {
                          updateField(topic.code, 'permanent_city', v)
                        }
                      }}
                    />
                    {(data.residence_state || data.state || topicData.applicant_details?.residence_state) && !(data.residence_city || data.city || topicData.applicant_details?.residence_city) && (
                      <p className="text-[11px] font-medium text-amber-600 mt-1">⚠️ City selection required</p>
                    )}
                  </div>

                  <div>
                    <Label className="font-medium text-xs text-slate-700 mb-1 block">4. PIN Code <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                        updateField(topic.code, 'residence_pincode', val)
                        updateField(topic.code, 'pincode', val)
                        if (data.same_as_residence) {
                          updateField(topic.code, 'permanent_pincode', val)
                        }
                      }}
                      placeholder="6-digit PIN Code"
                      className={`text-xs h-9 ${(data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || '').length > 0 && (data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || '').length < 6 ? "border-amber-500 bg-amber-50/40 focus:ring-amber-500" : "bg-white"}`}
                    />
                    {(data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || '').length > 0 && (data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || '').length < 6 && (
                      <p className="text-[11px] font-medium text-amber-600 mt-1">
                        ⚠️ PIN Code must be 6 digits (currently {(data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || '').length}/6)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Permanent Address */}
              <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="font-semibold text-slate-900 flex items-center gap-2">
                    2. Permanent Address
                    {!data.same_as_residence && (
                      <span className={`text-[11px] font-semibold ${(data.permanent_address || '').trim().length > 240 ? 'text-red-600' : 'text-slate-500'}`}>
                        {(data.permanent_address || '').trim().length}/250 chars
                      </span>
                    )}
                  </Label>
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1 rounded-lg border border-slate-300 shadow-2xs hover:bg-slate-100 transition-all select-none">
                    <input
                      type="checkbox"
                      checked={!!data.same_as_residence}
                      onChange={(e) => {
                        const isChecked = e.target.checked
                        updateField(topic.code, 'same_as_residence', isChecked)
                        if (isChecked) {
                          const residenceAddr = data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address || ''
                          const residenceState = data.residence_state || data.state || topicData.applicant_details?.residence_state || ''
                          const residenceCity = data.residence_city || data.city || topicData.applicant_details?.residence_city || ''
                          const residencePin = data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || ''
                          updateField(topic.code, 'permanent_address', residenceAddr)
                          updateField(topic.code, 'permanent_state', residenceState)
                          updateField(topic.code, 'permanent_city', residenceCity)
                          updateField(topic.code, 'permanent_pincode', residencePin)
                          toast.success('Permanent Address set same as Residence Address')
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${data.same_as_residence ? 'text-blue-600' : 'text-slate-400'}`} />
                      Same as Residence Address
                    </span>
                  </label>
                </div>

                <div>
                  <Label className="text-xs text-slate-600 mb-1 block font-medium">1. Address Line (Door/Flat No, Street, Area, Landmark)</Label>
                  <Textarea
                    value={data.same_as_residence ? (data.residence_address || data.correspondence_address || data.address || topicData.applicant_details?.address || '') : (data.permanent_address || '')}
                    onChange={(e) => updateField(topic.code, 'permanent_address', e.target.value)}
                    disabled={!!data.same_as_residence}
                    rows={1}
                    maxLength={250}
                    placeholder={data.same_as_residence ? "Locked: Same as Residence Address (Uncheck toggle above to edit)" : "Door/Flat No, Street, Building, Area, Landmark"}
                    className={data.same_as_residence ? "h-10 text-xs py-2 bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-300 font-medium" : `h-10 text-xs py-2 ${hasPincodeInAddress(data.permanent_address) ? "border-red-500 bg-red-50/40 focus:ring-red-500" : "bg-white"}`}
                  />
                  {!data.same_as_residence && hasPincodeInAddress(data.permanent_address) && (
                    <p className="text-xs font-medium text-red-600 mt-1">
                      ❌ Pincode detected in permanent address box! Please remove the pincode from this text box and enter it in the separate PIN Code field below.
                    </p>
                  )}
                  {data.same_as_residence && (
                    <p className="text-[11px] text-blue-600 font-medium mt-1">
                      ℹ️ Permanent Address is locked & synced with Residence Address. Uncheck "Same as Residence Address" to edit separately.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <Label className="font-medium text-xs text-slate-700 mb-1 block">2. State</Label>
                    <SearchableSelect
                      options={Object.keys(INDIAN_STATES_CITIES)}
                      value={data.same_as_residence ? (data.residence_state || data.state || topicData.applicant_details?.residence_state || '') : (data.permanent_state || '')}
                      placeholder="Search & Select State..."
                      disabled={!!data.same_as_residence}
                      onValueChange={(v) => {
                        updateField(topic.code, 'permanent_state', v)
                        updateField(topic.code, 'permanent_city', '')
                      }}
                    />
                  </div>

                  <div>
                    <Label className="font-medium text-xs text-slate-700 mb-1 block">3. City</Label>
                    <SearchableSelect
                      options={INDIAN_STATES_CITIES[data.same_as_residence ? (data.residence_state || data.state || topicData.applicant_details?.residence_state) : data.permanent_state] || ["Other"]}
                      value={data.same_as_residence ? (data.residence_city || data.city || topicData.applicant_details?.residence_city || '') : (data.permanent_city || '')}
                      placeholder={(data.same_as_residence ? (data.residence_state || data.state || topicData.applicant_details?.residence_state) : data.permanent_state) ? "Search & Select City..." : "Select State First"}
                      disabled={!!data.same_as_residence || !(data.same_as_residence ? (data.residence_state || data.state || topicData.applicant_details?.residence_state) : data.permanent_state)}
                      onValueChange={(v) => updateField(topic.code, 'permanent_city', v)}
                    />
                    {!data.same_as_residence && (data.permanent_state) && !(data.permanent_city) && (
                      <p className="text-[11px] font-medium text-amber-600 mt-1">⚠️ City selection required</p>
                    )}
                  </div>

                  <div>
                    <Label className="font-medium text-xs text-slate-700 mb-1 block">4. PIN Code <span className="text-red-500">*</span></Label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={data.same_as_residence ? (data.residence_pincode || data.pincode || topicData.applicant_details?.pincode || '') : (data.permanent_pincode || '')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                        updateField(topic.code, 'permanent_pincode', val)
                      }}
                      disabled={!!data.same_as_residence}
                      placeholder="6-digit PIN Code"
                      className={data.same_as_residence ? "text-xs h-9 bg-slate-100 cursor-not-allowed" : `text-xs h-9 ${(data.permanent_pincode || '').length > 0 && (data.permanent_pincode || '').length < 6 ? "border-amber-500 bg-amber-50/40 focus:ring-amber-500" : "bg-white"}`}
                    />
                    {!data.same_as_residence && (data.permanent_pincode || '').length > 0 && (data.permanent_pincode || '').length < 6 && (
                      <p className="text-[11px] font-medium text-amber-600 mt-1">
                        ⚠️ PIN Code must be 6 digits (currently {(data.permanent_pincode || '').length}/6)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'kyc_details': {
        const aadhaarVal = (data.aadhaar || '').toString().trim()
        const cleanAadhaar = aadhaarVal.replace(/\s/g, '')
        const panVal = (data.pan || '').toString().trim()

        const isAadhaarValid = cleanAadhaar.length === 12 && /^\d{12}$/.test(cleanAadhaar)
        const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panVal.toUpperCase())

        return (
          <div className="space-y-4">
            {/* Div 1: Aadhaar Card Details & Upload (Mandatory) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  🆔 1. Aadhaar Card Details & Document <span className="text-red-500">*</span>
                </h4>
                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Mandatory Document
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Aadhaar Number <span className="text-red-500">*</span></Label>
                  <Input
                    maxLength={14}
                    value={data.aadhaar || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d\s]/g, '').slice(0, 14)
                      updateField(topic.code, 'aadhaar', val)
                    }}
                    placeholder="12-digit Aadhaar Number (e.g. 1234 5678 9012)"
                    className={`bg-white font-mono text-xs ${
                      aadhaarVal && !isAadhaarValid ? 'border-amber-500 bg-amber-50/40' : aadhaarVal && isAadhaarValid ? 'border-emerald-500 bg-emerald-50' : ''
                    }`}
                  />
                  {aadhaarVal && !isAadhaarValid && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1">⚠️ Aadhaar number must be 12 numeric digits</p>
                  )}
                  {aadhaarVal && isAadhaarValid && (
                    <p className="text-[11px] font-medium text-emerald-600 mt-1">✅ Valid Aadhaar Number format</p>
                  )}
                </div>

                <div>
                  <KycDocUploader
                    label="Aadhaar Card Document"
                    value={data.aadhaar_doc}
                    disabled={isCategoryVerified}
                    onChange={(val) => updateField(topic.code, 'aadhaar_doc', val)}
                  />
                  {!data.aadhaar_doc && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1">⚠️ Please upload Aadhaar Card Photo or PDF</p>
                  )}
                </div>
              </div>
            </div>

            {/* Div 2: PAN Card Details & Upload (Mandatory) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  💳 2. PAN Card Details & Document <span className="text-red-500">*</span>
                </h4>
                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Mandatory Document
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">PAN Card Number <span className="text-red-500">*</span></Label>
                  <Input
                    maxLength={10}
                    value={data.pan || ''}
                    onChange={(e) => updateField(topic.code, 'pan', e.target.value.toUpperCase())}
                    placeholder="10-char PAN No. (e.g. ABCDE1234F)"
                    className={`bg-white font-mono uppercase text-xs ${
                      panVal && !isPanValid ? 'border-amber-500 bg-amber-50/40' : panVal && isPanValid ? 'border-emerald-500 bg-emerald-50' : ''
                    }`}
                  />
                  {panVal && !isPanValid && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1">⚠️ PAN number must be 10 characters (5 letters, 4 digits, 1 letter)</p>
                  )}
                  {panVal && isPanValid && (
                    <p className="text-[11px] font-medium text-emerald-600 mt-1">✅ Valid PAN Number format</p>
                  )}
                </div>

                <div>
                  <KycDocUploader
                    label="PAN Card Document"
                    value={data.pan_doc}
                    disabled={isCategoryVerified}
                    onChange={(val) => updateField(topic.code, 'pan_doc', val)}
                  />
                  {!data.pan_doc && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1">⚠️ Please upload PAN Card Photo or PDF</p>
                  )}
                </div>
              </div>
            </div>

            {/* Div 3: Voter ID Details & Upload (Optional) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  🗳️ 3. Voter ID Details & Document <span className="text-slate-500 font-normal">(Optional)</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Optional Document
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Voter ID Number (EPIC No)</Label>
                  <Input
                    maxLength={12}
                    value={data.voter_id || ''}
                    onChange={(e) => updateField(topic.code, 'voter_id', e.target.value.toUpperCase())}
                    placeholder="e.g. ABC1234567 (Optional)"
                    className="bg-white font-mono uppercase text-xs"
                  />
                </div>

                <div>
                  <KycDocUploader
                    label="Voter ID Document"
                    value={data.voter_doc}
                    disabled={isCategoryVerified}
                    onChange={(val) => updateField(topic.code, 'voter_doc', val)}
                  />
                </div>
              </div>
            </div>

            {/* Div 4: Ration Card / Additional Identity Document (Optional) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  📄 4. Ration Card / Additional Identity Document <span className="text-slate-500 font-normal">(Optional)</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Optional Document
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Ration Card / Other ID Number</Label>
                  <Input
                    value={data.ration_card || ''}
                    onChange={(e) => updateField(topic.code, 'ration_card', e.target.value)}
                    placeholder="Ration Card or Driving License No (Optional)"
                    className="bg-white text-xs"
                  />
                </div>

                <div>
                  <KycDocUploader
                    label="Ration Card / Other ID Document"
                    value={data.other_doc}
                    disabled={isCategoryVerified}
                    onChange={(val) => updateField(topic.code, 'other_doc', val)}
                  />
                </div>
              </div>
            </div>

            {/* Applicant Live Selfie Capture (Mandatory KYC Camera Photo) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <Label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span>📷 Applicant Live Selfie Capture (Mandatory Camera Photo) <span className="text-red-500">*</span></span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-sans">
                  Camera Only (Front/Back)
                </span>
              </Label>
              <CameraPhotoCapture
                photoUrl={data.live_selfie_url || data.photo_url}
                disabled={isCategoryVerified}
                onCapture={(val) => {
                  updateField(topic.code, 'live_selfie_url', val)
                  updateField(topic.code, 'photo_url', val)
                }}
              />
            </div>
          </div>
        )
      }
      case 'work_details':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-slate-800">Employment / Work Type <span className="text-red-500">*</span></Label>
                <Select
                  value={data.employment_type || ''}
                  onValueChange={(v) => updateField(topic.code, 'employment_type', v)}
                >
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Select Employment Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried">Salaried (Private / Govt Employee)</SelectItem>
                    <SelectItem value="self_employed">Self Employed</SelectItem>
                    <SelectItem value="business">Business / Enterprise Owner</SelectItem>
                    <SelectItem value="agriculture">Agriculture / Farming</SelectItem>
                    <SelectItem value="daily_wage">Daily Wage / Laborer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-semibold text-slate-800">Monthly Income (INR) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={data.monthly_income || ''}
                  onChange={(e) => updateField(topic.code, 'monthly_income', e.target.value)}
                  placeholder="e.g. 25000"
                  className="bg-white"
                />
              </div>
            </div>

            {/* If Salaried */}
            {data.employment_type === 'salaried' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">🏢 Salaried Employment Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium text-slate-700">Company / Employer Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={data.employer || data.company_name || ''}
                      onChange={(e) => {
                        updateField(topic.code, 'employer', e.target.value)
                        updateField(topic.code, 'company_name', e.target.value)
                      }}
                      placeholder="Organization or Company Name"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label className="font-medium text-slate-700">Designation / Role</Label>
                    <Input
                      value={data.designation || ''}
                      onChange={(e) => updateField(topic.code, 'designation', e.target.value)}
                      placeholder="e.g. Executive, Manager, Accountant"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label className="font-medium text-slate-700">Years in Current Job</Label>
                    <Input
                      type="number"
                      value={data.years_in_job || ''}
                      onChange={(e) => updateField(topic.code, 'years_in_job', e.target.value)}
                      placeholder="e.g. 3"
                      className="bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="font-medium text-slate-700">Company Address <span className="text-red-500">*</span></Label>
                    <Textarea
                      rows={2}
                      value={data.company_address || data.work_address || ''}
                      onChange={(e) => {
                        updateField(topic.code, 'company_address', e.target.value)
                        updateField(topic.code, 'work_address', e.target.value)
                      }}
                      placeholder="Building/Door No, Street, Area, City & PIN Code of Company"
                      className="bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* If Self Employed or Business */}
            {(data.employment_type === 'self_employed' || data.employment_type === 'business') && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">🏬 Business & Self-Employment Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium text-slate-700">Business / Shop Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={data.employer || data.business_name || ''}
                      onChange={(e) => {
                        updateField(topic.code, 'employer', e.target.value)
                        updateField(topic.code, 'business_name', e.target.value)
                      }}
                      placeholder="Shop or Business Name"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label className="font-medium text-slate-700">Business Category <span className="text-red-500">*</span></Label>
                    <Select
                      value={data.business_category || ''}
                      onValueChange={(v) => updateField(topic.code, 'business_category', v)}
                    >
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select Business Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grocery">Kirana / Grocery / Supermarket</SelectItem>
                        <SelectItem value="retail">Retail Shop / Showroom</SelectItem>
                        <SelectItem value="wholesale">Wholesale Trader / Distributor</SelectItem>
                        <SelectItem value="food_catering">Food & Catering / Hotel / Restaurant</SelectItem>
                        <SelectItem value="textiles_garments">Textiles & Garments / Tailoring</SelectItem>
                        <SelectItem value="handicrafts_artisan">Handicrafts, Pottery & Artisan Work</SelectItem>
                        <SelectItem value="manufacturing">Light Manufacturing / Workshop / Assembly</SelectItem>
                        <SelectItem value="services">Services (Salon, Repair, Plumbing, Electrical)</SelectItem>
                        <SelectItem value="transport">Transport, Logistics & Vehicle Services</SelectItem>
                        <SelectItem value="agriculture_dairy">Dairy, Poultry, Agro Processing & Trading</SelectItem>
                        <SelectItem value="construction_realestate">Construction, Building Material & Hardware</SelectItem>
                        <SelectItem value="other">Other Business Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="font-medium text-slate-700">Business Registration / GST / Udyam No.</Label>
                    <Input
                      value={data.business_registration || ''}
                      onChange={(e) => updateField(topic.code, 'business_registration', e.target.value)}
                      placeholder="GSTIN / Udyam / License No. (Optional)"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label className="font-medium text-slate-700">Years in Business</Label>
                    <Input
                      type="number"
                      value={data.years_in_job || data.years_in_business || ''}
                      onChange={(e) => {
                        updateField(topic.code, 'years_in_job', e.target.value)
                        updateField(topic.code, 'years_in_business', e.target.value)
                      }}
                      placeholder="e.g. 5"
                      className="bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="font-medium text-slate-700">Business / Shop Address <span className="text-red-500">*</span></Label>
                    <Textarea
                      rows={2}
                      value={data.company_address || data.business_address || data.work_address || ''}
                      onChange={(e) => {
                        updateField(topic.code, 'company_address', e.target.value)
                        updateField(topic.code, 'business_address', e.target.value)
                        updateField(topic.code, 'work_address', e.target.value)
                      }}
                      placeholder="Shop No, Street, Market Area, City & PIN Code of Business"
                      className="bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Other / Agriculture / Daily Wage */}
            {(data.employment_type === 'agriculture' || data.employment_type === 'daily_wage') && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">🌾 Work & Location Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label className="font-medium text-slate-700">Work Location / Farm Address</Label>
                    <Textarea
                      rows={2}
                      value={data.company_address || data.work_address || ''}
                      onChange={(e) => {
                        updateField(topic.code, 'company_address', e.target.value)
                        updateField(topic.code, 'work_address', e.target.value)
                      }}
                      placeholder="Village, Land/Work Location, Area, District"
                      className="bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Work & Banking Document Upload Section (Optional Proofs) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  📁 Banking & Employment Document Uploads <span className="text-slate-500 font-normal">(Optional)</span>
                </h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Optional Documents
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Last 3 Months Bank Statement */}
                <div>
                  <KycDocUploader
                    label="Last 3 Months Bank Statement"
                    value={data.bank_statement_doc}
                    disabled={isCategoryVerified}
                    onChange={(val) => updateField(topic.code, 'bank_statement_doc', val)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Upload Passbook photo, e-Statement PDF, or Net Banking PDF</p>
                </div>

                {/* 2. Dynamic Employment Proof */}
                <div>
                  <KycDocUploader
                    label={
                      data.employment_type === 'salaried'
                        ? 'Salary Slip / Appointment Order'
                        : data.employment_type === 'self_employed' || data.employment_type === 'business'
                        ? 'Business Registration / Shop Photo'
                        : data.employment_type === 'agriculture'
                        ? 'Patta / Land Record / Agro Receipt'
                        : 'Labor Card / Work Proof'
                    }
                    value={data.employment_proof_doc}
                    disabled={isCategoryVerified}
                    onChange={(val) => updateField(topic.code, 'employment_proof_doc', val)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {data.employment_type === 'salaried'
                      ? 'Upload Salary Slip (Last 3 Months), Offer Letter, or Employee ID'
                      : data.employment_type === 'self_employed' || data.employment_type === 'business'
                      ? 'Upload GST, Udyam Certificate, Trade License, or Shop Photo'
                      : data.employment_type === 'agriculture'
                      ? 'Upload Patta/Chitta land document or Farmer ID'
                      : 'Upload Labor Card, Worker ID, or Work Site photo'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label className="font-medium text-slate-700">Work Description / Additional Notes</Label>
              <Textarea
                value={data.work_description || ''}
                onChange={(e) => updateField(topic.code, 'work_description', e.target.value)}
                rows={2}
                placeholder="Brief description of work responsibilities, products sold, or daily work type..."
                className="bg-white"
              />
            </div>
          </div>
        )
      case 'family_details':
      case 'family_references': {
        const familyMembers = Array.isArray(data.family_members) && data.family_members.length > 0
          ? data.family_members
          : [{ name: '', relation: '', dob: '', occupation: '', monthly_income: '' }]

        const updateFamilyMember = (index, field, value) => {
          const updated = [...familyMembers]
          updated[index] = { ...updated[index], [field]: value }
          updateField(topic.code, 'family_members', updated)
        }

        const addFamilyMember = () => {
          const updated = [...familyMembers, { name: '', relation: '', dob: '', occupation: '', monthly_income: '' }]
          updateField(topic.code, 'family_members', updated)
        }

        const removeFamilyMember = (index) => {
          if (familyMembers.length <= 1) {
            toast.error('At least 1 family member is required.')
            return
          }
          const updated = familyMembers.filter((_, i) => i !== index)
          updateField(topic.code, 'family_members', updated)
        }

        return (
          <div className="space-y-6">
            <div className="border border-slate-200/90 bg-slate-50/50 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Family Member Details <span className="text-red-500">*</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Provide details of at least 1 family member (Relation, Occupation, DOB, Monthly Income). Additional members are optional.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFamilyMember}
                  className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 text-xs font-medium gap-1.5 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Additional Family Member
                </Button>
              </div>

              <div className="space-y-4">
                {familyMembers.map((member, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                        Family Member #{idx + 1} {idx === 0 ? <span className="text-red-500">* (Required)</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
                      </span>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => removeFamilyMember(idx)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-slate-700">
                          Member Name {idx === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          value={member.name || ''}
                          onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)}
                          placeholder="Full Name"
                          className="mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-700">
                          Relation Type {idx === 0 && <span className="text-red-500">*</span>}
                        </Label>
                        <Select
                          value={member.relation || ''}
                          onValueChange={(val) => updateFamilyMember(idx, 'relation', val)}
                        >
                          <SelectTrigger className="mt-1 text-xs bg-white">
                            <SelectValue placeholder="Select Relation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Father">Father</SelectItem>
                            <SelectItem value="Mother">Mother</SelectItem>
                            <SelectItem value="Spouse">Spouse</SelectItem>
                            <SelectItem value="Son">Son</SelectItem>
                            <SelectItem value="Daughter">Daughter</SelectItem>
                            <SelectItem value="Brother">Brother</SelectItem>
                            <SelectItem value="Sister">Sister</SelectItem>
                            <SelectItem value="Dependent">Dependent</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Date of Birth (DOB)</Label>
                        <Input
                          type="date"
                          value={member.dob || ''}
                          onChange={(e) => updateFamilyMember(idx, 'dob', e.target.value)}
                          className="mt-1 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Occupation</Label>
                        <Select
                          value={member.occupation || ''}
                          onValueChange={(val) => updateFamilyMember(idx, 'occupation', val)}
                        >
                          <SelectTrigger className="mt-1 text-xs bg-white">
                            <SelectValue placeholder="Select Occupation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Salaried">Salaried</SelectItem>
                            <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                            <SelectItem value="Business">Business Owner</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Homemaker">Homemaker</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                            <SelectItem value="Unemployed">Unemployed</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-700">Monthly Income (₹)</Label>
                        <Input
                          type="number"
                          value={member.monthly_income || ''}
                          onChange={(e) => updateFamilyMember(idx, 'monthly_income', e.target.value)}
                          placeholder="e.g. 25000"
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
      case 'banking_details': {
        const applicantFirstName = topicData.applicant_details?.first_name || topicData.basic_details?.first_name || ''
        const applicantLastName = topicData.applicant_details?.last_name || topicData.basic_details?.last_name || ''
        const applicantFullName = `${applicantFirstName} ${applicantLastName}`.trim()
        
        const accHolderName = data.account_holder_name || ''
        const accNumber = data.account_number || ''
        const confirmAccNumber = data.confirm_account_number || ''
        
        const isAccountMatch = accNumber && confirmAccNumber && accNumber === confirmAccNumber
        const isAccountMismatch = accNumber && confirmAccNumber && accNumber !== confirmAccNumber

        // Name match check
        const cleanApplicant = applicantFullName.toLowerCase().replace(/[^a-z]/g, '')
        const cleanHolder = accHolderName.toLowerCase().replace(/[^a-z]/g, '')
        const isNameMatched = cleanApplicant && cleanHolder && (cleanApplicant === cleanHolder || cleanHolder.includes(cleanApplicant) || cleanApplicant.includes(cleanHolder))
        const isNameDifferent = cleanApplicant && cleanHolder && !isNameMatched

        return (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  🏦 Bank Account & Ownership Details
                </h4>
                {applicantFullName && (
                  <button
                    type="button"
                    onClick={() => updateField(topic.code, 'account_holder_name', applicantFullName)}
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                  >
                    Set Applicant Name ({applicantFullName})
                  </button>
                )}
              </div>

              {/* 1. Account Holder Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">
                    Account Holder Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={accHolderName}
                    onChange={(e) => updateField(topic.code, 'account_holder_name', e.target.value)}
                    placeholder="Name as printed on Bank Passbook / Statement"
                    className={`bg-white text-xs ${isNameDifferent ? 'border-amber-500 bg-amber-50/40 focus:ring-amber-500' : isNameMatched ? 'border-emerald-500 bg-emerald-50/40' : ''}`}
                  />
                  {isNameMatched && (
                    <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                      ✅ Account Holder Name matches Applicant Name ({applicantFullName})
                    </p>
                  )}
                  {isNameDifferent && (
                    <p className="text-[11px] font-medium text-amber-600 mt-1">
                      ⚠️ Account Holder Name ("{accHolderName}") differs from Applicant Name ("{applicantFullName}"). Please select Ownership Type.
                    </p>
                  )}
                </div>

                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Account Ownership / Type</Label>
                  <Select
                    value={data.account_ownership || (isNameMatched ? 'self' : 'joint')}
                    onValueChange={(v) => updateField(topic.code, 'account_ownership', v)}
                  >
                    <SelectTrigger className="bg-white text-xs"><SelectValue placeholder="Select Ownership" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self">Self (Single Account Holder)</SelectItem>
                      <SelectItem value="joint_spouse">Joint Account (Spouse)</SelectItem>
                      <SelectItem value="joint_parent">Joint Account (Parent / Child)</SelectItem>
                      <SelectItem value="third_party">Third Party Account (Family Member)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 2. Account Number & Confirm Account Number (TWO BOXES) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">1. Bank Account Number <span className="text-red-500">*</span></Label>
                  <Input
                    type="password"
                    maxLength={18}
                    value={accNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 18)
                      updateField(topic.code, 'account_number', val)
                    }}
                    placeholder="Enter 9 to 18 digit Account No"
                    className="bg-white font-mono tracking-wider text-xs"
                  />
                </div>

                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">2. Confirm Bank Account Number <span className="text-red-500">*</span></Label>
                  <Input
                    type="text"
                    maxLength={18}
                    value={confirmAccNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 18)
                      updateField(topic.code, 'confirm_account_number', val)
                    }}
                    placeholder="Re-enter Bank Account No"
                    className={`font-mono tracking-wider text-xs ${
                      isAccountMismatch
                        ? 'border-red-500 bg-red-50 focus:ring-red-500'
                        : isAccountMatch
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'bg-white'
                    }`}
                  />
                  {isAccountMismatch && (
                    <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                      ❌ Account Numbers do not match! Please verify both boxes.
                    </p>
                  )}
                  {isAccountMatch && (
                    <p className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
                      ✅ Bank Account Numbers match.
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Bank Name, IFSC Code, Account Type, Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <Label className="font-medium text-slate-700 block mb-1 text-xs">Bank Name <span className="text-red-500">*</span></Label>
                  <Input
                    value={data.bank_name || ''}
                    onChange={(e) => updateField(topic.code, 'bank_name', e.target.value)}
                    placeholder="e.g. State Bank of India, HDFC Bank"
                    className="bg-white text-xs"
                  />
                </div>

                <div>
                  <Label className="font-medium text-slate-700 block mb-1 text-xs">IFSC Code <span className="text-red-500">*</span></Label>
                  <Input
                    maxLength={11}
                    value={data.ifsc_code || ''}
                    onChange={(e) => updateField(topic.code, 'ifsc_code', e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0001234"
                    className={`bg-white text-xs font-mono uppercase ${
                      data.ifsc_code && data.ifsc_code.length !== 11 ? 'border-amber-500 bg-amber-50/40' : ''
                    }`}
                  />
                  {data.ifsc_code && data.ifsc_code.length !== 11 && (
                    <p className="text-[11px] font-medium text-amber-600 mt-0.5">⚠️ IFSC must be 11 characters</p>
                  )}
                </div>

                <div>
                  <Label className="font-medium text-slate-700 block mb-1 text-xs">Account Type</Label>
                  <Select value={data.account_type || 'savings'} onValueChange={(v) => updateField(topic.code, 'account_type', v)}>
                    <SelectTrigger className="bg-white text-xs"><SelectValue placeholder="Select Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings Account</SelectItem>
                      <SelectItem value="current">Current Account</SelectItem>
                      <SelectItem value="od">Overdraft (OD) / CC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-medium text-slate-700 block mb-1 text-xs">Bank Branch</Label>
                  <Input
                    value={data.bank_branch || ''}
                    onChange={(e) => updateField(topic.code, 'bank_branch', e.target.value)}
                    placeholder="Branch location"
                    className="bg-white text-xs"
                  />
                </div>

                <div>
                  <Label className="font-medium text-slate-700 block mb-1 text-xs">Average Monthly Balance (INR)</Label>
                  <Input
                    type="number"
                    value={data.avg_balance || ''}
                    onChange={(e) => updateField(topic.code, 'avg_balance', e.target.value)}
                    placeholder="e.g. 10000"
                    className="bg-white text-xs"
                  />
                </div>
              </div>

              {/* 4. Bank Passbook / Bank Statement Document Upload */}
              <div className="pt-3 border-t border-slate-200 space-y-1">
                <Label className="font-semibold text-slate-800 block text-xs uppercase tracking-wider">
                  📂 Bank Passbook / Bank Statement Document Upload
                </Label>
                <KycDocUploader
                  label="Bank Passbook / Statement Document"
                  value={data.bank_statement_doc || data.passbook_doc || data.bank_statement || data.cheque_doc}
                  disabled={isCategoryVerified}
                  onChange={(val) => {
                    updateField(topic.code, 'bank_statement_doc', val)
                    updateField(topic.code, 'passbook_doc', val)
                    updateField(topic.code, 'bank_statement', val)
                  }}
                />
                <p className="text-[11px] text-slate-500">Upload Passbook photo, Cancelled Cheque, or Bank Statement PDF</p>
              </div>
            </div>
          </div>
        )
      }
      case 'ratio_analysis':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Debt-to-Income Ratio</Label><Input type="number" step="0.01" value={data.debt_income_ratio || ''} onChange={(e) => updateField(topic.code, 'debt_income_ratio', e.target.value)} /></div>
            <div><Label>Loan-to-Value Ratio</Label><Input type="number" step="0.01" value={data.loan_value_ratio || ''} onChange={(e) => updateField(topic.code, 'loan_value_ratio', e.target.value)} /></div>
            <div><Label>Current DSR (%)</Label><Input type="number" step="0.01" value={data.current_dsr || ''} onChange={(e) => updateField(topic.code, 'current_dsr', e.target.value)} /></div>
            <div><Label>Proposed DSR (%)</Label><Input type="number" step="0.01" value={data.proposed_dsr || ''} onChange={(e) => updateField(topic.code, 'proposed_dsr', e.target.value)} /></div>
            <div className="col-span-2"><Label>Assessment Notes</Label><Textarea value={data.ratio_notes || ''} onChange={(e) => updateField(topic.code, 'ratio_notes', e.target.value)} rows={4} /></div>
          </div>
        )
      case 'obligations':
        return (
          <div className="space-y-4">
            <div><Label>Existing Loan Obligations</Label><Textarea value={data.existing_loans || ''} onChange={(e) => updateField(topic.code, 'existing_loans', e.target.value)} rows={3} placeholder="List existing loans, amounts, EMIs..." /></div>
            <div><Label>Credit Card Debt</Label><Input type="number" value={data.credit_card_debt || ''} onChange={(e) => updateField(topic.code, 'credit_card_debt', e.target.value)} /></div>
            <div><Label>Monthly Commitments</Label><Input type="number" value={data.monthly_commitments || ''} onChange={(e) => updateField(topic.code, 'monthly_commitments', e.target.value)} /></div>
            <div><Label>Guarantee Given</Label><Input type="number" value={data.guarantee_amount || ''} onChange={(e) => updateField(topic.code, 'guarantee_amount', e.target.value)} /></div>
          </div>
        )
      case 'income_details':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Primary Income</Label><Input type="number" value={data.primary || ''} onChange={(e) => updateField(topic.code, 'primary', e.target.value)} /></div>
            <div><Label>Secondary Income</Label><Input type="number" value={data.secondary || ''} onChange={(e) => updateField(topic.code, 'secondary', e.target.value)} /></div>
            <div><Label>Spouse Income</Label><Input type="number" value={data.spouse_income || ''} onChange={(e) => updateField(topic.code, 'spouse_income', e.target.value)} /></div>
            <div><Label>Other Income</Label><Input type="number" value={data.other_income || ''} onChange={(e) => updateField(topic.code, 'other_income', e.target.value)} /></div>
            <div className="col-span-2"><Label>Total Household Income</Label><Input type="number" value={data.total || ''} onChange={(e) => updateField(topic.code, 'total', e.target.value)} /></div>
            <div className="col-span-2"><Label>Income Source Verification</Label><Textarea value={data.income_verification || ''} onChange={(e) => updateField(topic.code, 'income_verification', e.target.value)} rows={3} placeholder="How was income verified? Bank statements, salary slips, etc." /></div>
          </div>
        )
      case 'customer_wealth':
        return (
          <div className="space-y-4">
            <div><Label>Savings / Deposits</Label><Input type="number" value={data.savings || ''} onChange={(e) => updateField(topic.code, 'savings', e.target.value)} /></div>
            <div><Label>Gold / Jewellery Value</Label><Input type="number" value={data.gold_value || ''} onChange={(e) => updateField(topic.code, 'gold_value', e.target.value)} /></div>
            <div><Label>Property Value</Label><Input type="number" value={data.property_value || ''} onChange={(e) => updateField(topic.code, 'property_value', e.target.value)} /></div>
            <div><Label>Vehicle Value</Label><Input type="number" value={data.vehicle_value || ''} onChange={(e) => updateField(topic.code, 'vehicle_value', e.target.value)} /></div>
            <div><Label>Insurance Policies</Label><Input value={data.insurance || ''} onChange={(e) => updateField(topic.code, 'insurance', e.target.value)} placeholder="Policy numbers and amounts" /></div>
            <div className="col-span-2"><Label>Other Assets</Label><Textarea value={data.other_assets || ''} onChange={(e) => updateField(topic.code, 'other_assets', e.target.value)} rows={3} /></div>
          </div>
        )
      case 'product_details': {
        const isOthersSelected = formData.product_id === 'others' || formData.loan_purpose_category === 'others'

        const getSelectedProductName = (id) => {
          if (!id) return null
          const staticMap = {
            educational_fees: 'Educational Fees (School / College / Course)',
            personal_loan: 'Personal / Family Requirement',
            business_loan: 'Business Expansion / Working Capital',
            agriculture_loan: 'Agriculture & Farming Expense',
            home_repair: 'Home Repair / Construction',
            medical_emergency: 'Medical & Health Emergency',
            others: 'Others (Please specify below)'
          }
          if (staticMap[id]) return staticMap[id]
          const matchedProd = products?.find(p => p.id === id)
          return matchedProd ? matchedProd.product_name : null
        }

        const getSelectedBranchName = (id) => {
          if (!id) return null
          const matchedBranch = branches?.find(b => b.id === id)
          if (matchedBranch) return matchedBranch.branch_name
          const matchedArea = areas?.find(a => a.id === id)
          if (matchedArea) return `${matchedArea.area_name} (${matchedArea.branch_name || ''})`
          return null
        }

        return (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                📋 Loan Product & Purpose Details
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Loan Product / Purpose <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(v) => {
                      const selectedProd = products?.find(p => p.id === v)
                      const updated = {
                        ...formData,
                        product_id: v,
                        loan_purpose_category: v,
                        interest_rate: selectedProd?.interest_rate || formData.interest_rate || 14
                      }
                      setFormData(updated)
                      setTopicData((prev) => ({ ...prev, product_details: { ...(prev.product_details || {}), ...updated } }))
                    }}
                  >
                    <SelectTrigger className="bg-white text-xs">
                      <SelectValue placeholder="Select Loan Product / Purpose">
                        {getSelectedProductName(formData.product_id)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational_fees">Educational Fees (School / College / Course)</SelectItem>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.product_name}</SelectItem>
                      ))}
                      <SelectItem value="personal_loan">Personal / Family Requirement</SelectItem>
                      <SelectItem value="business_loan">Business Expansion / Working Capital</SelectItem>
                      <SelectItem value="agriculture_loan">Agriculture & Farming Expense</SelectItem>
                      <SelectItem value="home_repair">Home Repair / Construction</SelectItem>
                      <SelectItem value="medical_emergency">Medical & Health Emergency</SelectItem>
                      <SelectItem value="others">Others (Please specify below)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Branch Location <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.branch_id}
                    onValueChange={(v) => {
                      const updated = { ...formData, branch_id: v }
                      setFormData(updated)
                      setTopicData((prev) => ({ ...prev, product_details: { ...(prev.product_details || {}), ...updated } }))
                    }}
                  >
                    <SelectTrigger className="bg-white text-xs">
                      <SelectValue placeholder="Select Branch">
                        {getSelectedBranchName(formData.branch_id)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.branch_name}</SelectItem>)}
                      {areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.area_name} ({a.branch_name})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* If "Others" is chosen -> Must type custom loan purpose */}
                {isOthersSelected && (
                  <div className="sm:col-span-2 bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-1">
                    <Label className="font-semibold text-amber-900 block text-xs">
                      Specify Custom Loan Purpose <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.other_loan_purpose || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        const updated = { ...formData, other_loan_purpose: val }
                        setFormData(updated)
                        setTopicData((prev) => ({ ...prev, product_details: { ...(prev.product_details || {}), ...updated } }))
                      }}
                      placeholder="Please type specific reason for loan (e.g. Higher Education Admission Fees, Shop Renovation, Marriage Expense...)"
                      className="bg-white text-xs"
                    />
                    {!formData.other_loan_purpose?.trim() && (
                      <p className="text-[11px] font-medium text-amber-700 mt-1">⚠️ Custom loan purpose details are required when "Others" is selected.</p>
                    )}
                  </div>
                )}

                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Required Loan Amount (INR) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={formData.loan_amount}
                    onChange={(e) => {
                      const val = e.target.value
                      const updated = { ...formData, loan_amount: val }
                      setFormData(updated)
                      setTopicData((prev) => ({ ...prev, product_details: { ...(prev.product_details || {}), ...updated } }))
                    }}
                    placeholder="e.g. 50000"
                    className="bg-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <Label className="font-semibold text-slate-800 block mb-1">Requested Tenure (Months) <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    value={formData.tenure_months}
                    onChange={(e) => {
                      const val = e.target.value
                      const updated = { ...formData, tenure_months: val }
                      setFormData(updated)
                      setTopicData((prev) => ({ ...prev, product_details: { ...(prev.product_details || {}), ...updated } }))
                    }}
                    placeholder="e.g. 12"
                    className="bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Clean Repayment Summary without Interest Rate % Control */}
            {emiCalc && (
              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                <div className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wider">
                  📊 Estimated Loan Repayment Summary
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[11px] text-slate-500 block font-medium">Monthly EMI</span>
                    <div className="font-bold text-base text-blue-900">{formatCurrency(emiCalc.emi)}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[11px] text-slate-500 block font-medium">Tenure</span>
                    <div className="font-bold text-base text-blue-900">{formData.tenure_months} Months</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                    <span className="text-[11px] text-slate-500 block font-medium">Total Amount Payable</span>
                    <div className="font-bold text-base text-blue-900">{formatCurrency(emiCalc.totalPayable)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }
      case 'property_details':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Property Type</Label>
              <Select value={data.property_type} onValueChange={(v) => updateField(topic.code, 'property_type', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="land">Land</SelectItem><SelectItem value="none">No Property</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Property Owner</Label><Input value={data.property_owner || ''} onChange={(e) => updateField(topic.code, 'property_owner', e.target.value)} /></div>
            <div><Label>Property Value</Label><Input type="number" value={data.property_value || ''} onChange={(e) => updateField(topic.code, 'property_value', e.target.value)} /></div>
            <div><Label>Property Address</Label><Textarea value={data.property_address || ''} onChange={(e) => updateField(topic.code, 'property_address', e.target.value)} rows={2} /></div>
            <div><Label>Property Documents</Label><Input value={data.property_documents || ''} onChange={(e) => updateField(topic.code, 'property_documents', e.target.value)} placeholder="Document types submitted" /></div>
            <div><Label>Property Verified</Label>
              <Select value={data.property_verified} onValueChange={(v) => updateField(topic.code, 'property_verified', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        )
      case 'eligibility':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Credit Score / CIBIL</Label><Input type="number" value={data.credit_score || ''} onChange={(e) => updateField(topic.code, 'credit_score', e.target.value)} /></div>
            <div><Label>DSR Check</Label>
              <Select value={data.dsr_check} onValueChange={(v) => updateField(topic.code, 'dsr_check', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="passed">Passed</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="marginal">Marginal</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Eligible Amount</Label><Input type="number" value={data.eligible_amount || ''} onChange={(e) => updateField(topic.code, 'eligible_amount', e.target.value)} /></div>
            <div><Label>Recommendation</Label>
              <Select value={data.recommendation} onValueChange={(v) => updateField(topic.code, 'recommendation', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent><SelectItem value="approve">Approve</SelectItem><SelectItem value="reject">Reject</SelectItem><SelectItem value="query">Raise Query</SelectItem><SelectItem value="refer">Refer to Higher Authority</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Eligibility Remarks</Label><Textarea value={data.eligibility_remarks || ''} onChange={(e) => updateField(topic.code, 'eligibility_remarks', e.target.value)} rows={3} /></div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <Label>{topic.name} Data</Label>
            <Textarea
              value={data.text || data.data || ''}
              onChange={(e) => updateField(topic.code, 'text', e.target.value)}
              rows={8}
              placeholder={`Enter ${topic.name} data here...`}
            />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
              Step {currentTopic + 1} of {TOPICS.length}
            </span>
            {appId && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                ID: {appId}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            {topic.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in required details for this application section. Completed sections turn green automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {appId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/applications/${appId}`)}
              className="text-xs border-slate-300"
            >
              View Summary
            </Button>
          )}
        </div>
      </div>

      {/* Query Banner if Query Raised */}
      {existingApp?.status === 'query_raised' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4 shadow-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Query Raised by Verifier / Branch Admin</h4>
            <p className="text-xs text-amber-800 font-medium mt-0.5 leading-relaxed">
              {existingApp.notes || 'Please update requested documents or fields before resubmitting your application.'}
            </p>
          </div>
        </div>
      )}

      {/* Workflow Timeline Progress Bar */}
      <TimelineStepper
        topics={TOPICS}
        currentTopic={currentTopic}
        topicData={topicData}
        formData={formData}
        onSelectTopic={setCurrentTopic}
      />

      {/* Main Form Content Card */}
      <Card className="border border-slate-200/80 shadow-sm rounded-xl bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>{currentTopic + 1}. {topic.name}</span>
            <span className="text-xs font-normal text-slate-400">
              Section {currentTopic + 1} of {TOPICS.length}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {renderTopicContent()}
        </CardContent>

        <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentTopic === 0}
            className="border-slate-300 hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {!appId && currentTopic === TOPICS.length - 1 && (
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Application
              </Button>
            )}

            {appId && currentTopic === TOPICS.length - 1 && (
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                {existingApp?.status === 'query_raised' ? 'Resubmit Application for Review' : 'Submit for Review'}
              </Button>
            )}

            {currentTopic < TOPICS.length - 1 && (
              <Button
                onClick={handleNext}
                disabled={createMutation.isPending || updateTopicMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-5"
              >
                {(createMutation.isPending || updateTopicMutation.isPending) ? (
                  <>Saving...</>
                ) : (
                  <>
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
