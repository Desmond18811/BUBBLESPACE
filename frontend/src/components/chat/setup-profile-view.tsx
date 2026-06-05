import React, { useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'motion/react'
import { 
    Sparkles, User, Briefcase, Phone, Camera, Loader2, 
    ArrowRight, ArrowLeft, Upload, FileText, X, Check, 
    MapPin, Smile, Globe, Bookmark, Plus, Copy
} from 'lucide-react'
import { setupProfile, uploadAvatar, onboardOrgBrain, ingestOrgDocument, getOrgInviteCode } from '@/lib/api'
import { toast } from 'sonner'
import { BubblespaceLogo } from '../logo'
import { countries } from '@/lib/countries'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
    "Technology & Software",
    "Healthcare & Life Sciences",
    "Finance & Banking",
    "Education & E-Learning",
    "Retail & E-commerce",
    "Real Estate & Construction",
    "Manufacturing & Logistics",
    "Media & Entertainment",
    "Marketing & Advertising",
    "Professional Services & Consulting",
    "Hospitality & Tourism",
    "Energy & Utilities",
    "Non-Profit & Government",
    "Other"
]

const OFFICE_ROLES = [
    "Intern",
    "Associate",
    "Specialist",
    "Analyst",
    "Coordinator",
    "Developer",
    "Engineer",
    "Designer",
    "Manager",
    "Team Lead",
    "Project Manager",
    "Director",
    "Vice President (VP)",
    "Chief Technology Officer (CTO)",
    "Chief Product Officer (CPO)",
    "Chief Operating Officer (COO)",
    "Chief Marketing Officer (CMO)",
    "Chief Financial Officer (CFO)",
    "Chief Executive Officer (CEO)",
    "Founder"
]


export function SetupProfileView({
    user,
    onComplete
}: {
    user: any,
    onComplete: (updatedUser: any) => void
}) {
    const navigate = useNavigate()
    const isAdmin = user?.role === 'admin'
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [loading, setLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<string>('')
    const [successInvite, setSuccessInvite] = useState<{ inviteCode: string; orgName: string; userData: any } | null>(null)
    const [copiedLink, setCopiedLink] = useState(false)
    const [copiedCode, setCopiedCode] = useState(false)
    const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
        const phone = user?.phone_number || ''
        if (phone.startsWith('+')) {
            const matched = countries.find(c => phone.startsWith(c.dial_code))
            if (matched) return matched.code
        }
        return 'US'
    })
    
    // Core profile details
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        bio: '',
        organization: user?.organization || '',
        org_role: user?.org_role || '',
        phone_number: user?.phone_number || '',
    })

    // Business onboarding (Admins only)
    const [businessDesc, setBusinessDesc] = useState('')
    const [orgIndustry, setOrgIndustry] = useState(user?.org_industry || '')
    const [orgSize, setOrgSize] = useState(user?.org_size || '')
    
    // Media previews
    const [avatar, setAvatar] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')

    // Document Ingestion (Admins only)
    const [documents, setDocuments] = useState<{ name: string; content: string }[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAvatar(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files) processFiles(files)
    }

    const processFiles = (fileList: FileList) => {
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i]
            const validTypes = ['.txt', '.md', '.json', '.csv']
            const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
            
            if (!validTypes.includes(extension)) {
                toast.error(`Invalid format: ${file.name}. Only .txt, .md, .json, and .csv are supported for brain training.`)
                continue
            }

            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target?.result as string
                setDocuments(prev => {
                    if (prev.some(d => d.name === file.name)) return prev
                    return [...prev, { name: file.name, content }]
                })
                toast.success(`Loaded "${file.name}" successfully!`)
            }
            reader.onerror = () => {
                toast.error(`Error reading file: ${file.name}`)
            }
            reader.readAsText(file)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleRemoveDoc = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index))
    }

    const handleBackToAuth = () => {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user")
        localStorage.removeItem("bubblespace_private_key")
        navigate({ to: "/login" })
    }

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.full_name) {
            toast.error('Full name is required')
            return
        }
        if (!isAdmin) {
            handleCompleteWithoutOrg()
        } else {
            setStep(2)
        }
    }

    // Submit flow for standard individuals (1 Step)
    const handleCompleteWithoutOrg = async () => {
        setLoading(true)
        setUploadProgress('Uploading profile picture...')
        try {
            let finalAvatar = user?.avatar
            if (avatar) {
                const uploadRes = await uploadAvatar(avatar)
                finalAvatar = uploadRes.data.avatarUrl
            }

            setUploadProgress('Completing your profile details...')
            const res = await setupProfile({
                full_name: formData.full_name,
                bio: formData.bio,
                phone_number: formData.phone_number,
                avatar: finalAvatar,
                gender: null,
                status_message: null,
                mood_emoji: null,
                hobbies: [],
                location: null,
            })
            
            toast.success('Your profile setup is complete!')
            onComplete(res.data)
        } catch (err: any) {
            toast.error(err.message || 'Profile setup failed')
        } finally {
            setLoading(false)
            setUploadProgress('')
        }
    }

    // Submit flow for organizations/admins (3 Steps)
    const handleCompleteWithOrg = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!businessDesc || businessDesc.trim().length < 10) {
            toast.error('Please provide a detailed description of your business (at least 10 characters).')
            return
        }
        setLoading(true)
        setUploadProgress('Uploading logo / photo...')
        try {
            let finalAvatar = user?.avatar
            if (avatar) {
                const uploadRes = await uploadAvatar(avatar)
                finalAvatar = uploadRes.data.avatarUrl
            }

            setUploadProgress('Configuring organization profile...')
            const profileRes = await setupProfile({
                full_name: formData.full_name,
                bio: formData.bio,
                organization: formData.organization,
                org_role: formData.org_role,
                org_industry: orgIndustry || undefined,
                org_size: orgSize || undefined,
                phone_number: formData.phone_number,
                avatar: finalAvatar,
            })

            setUploadProgress("Training the company's brain...")
            let inviteCode = ''
            try {
                const brainRes = await onboardOrgBrain(businessDesc)
                inviteCode = brainRes.organization?.inviteCode || ''
            } catch (err) {
                console.error('onboardOrgBrain error:', err)
            }

            if (!inviteCode) {
                try {
                    const inviteRes = await getOrgInviteCode()
                    inviteCode = inviteRes.inviteCode || ''
                } catch (err) {
                    console.error('getOrgInviteCode fallback error:', err)
                }
            }

            if (documents.length > 0) {
                for (let i = 0; i < documents.length; i++) {
                    const doc = documents[i]
                    setUploadProgress(`Training brain with document ${i + 1} of ${documents.length}: ${doc.name}...`)
                    await ingestOrgDocument({
                        title: doc.name,
                        content: doc.content,
                        department: 'general',
                        accessLevel: 'public',
                        tags: ['onboarding', 'knowledge-training']
                    })
                }
            }
            
            toast.success("Organization brain and profile setup is fully configured!")
            
            if (inviteCode) {
                setSuccessInvite({
                    inviteCode,
                    orgName: formData.organization || user?.organization || 'your organization',
                    userData: profileRes.data
                })
            } else {
                onComplete(profileRes.data)
            }
        } catch (err: any) {
            toast.error(err.message || 'Brain setup failed')
        } finally {
            setLoading(false)
            setUploadProgress('')
        }
    }

    if (successInvite) {
        const inviteLink = `${window.location.origin}/signup?inviteCode=${successInvite.inviteCode}`
        
        const copyToClipboard = async (text: string) => {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text)
                    return true
                }
            } catch (e) {
                console.warn('navigator.clipboard failed, trying fallback:', e)
            }
            
            try {
                const textArea = document.createElement("textarea")
                textArea.value = text
                textArea.style.position = "fixed"
                textArea.style.top = "0"
                textArea.style.left = "0"
                textArea.style.opacity = "0"
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                const successful = document.execCommand('copy')
                document.body.removeChild(textArea)
                return successful
            } catch (err) {
                console.error('Fallback copy failed:', err)
                return false
            }
        }

        const handleCopyLink = async () => {
            const success = await copyToClipboard(inviteLink)
            if (success) {
                setCopiedLink(true)
                toast.success('Invite link copied to clipboard!')
                setTimeout(() => setCopiedLink(false), 2000)
            } else {
                toast.error('Failed to copy. Please copy manually.')
            }
        }

        const handleCopyCode = async () => {
            const success = await copyToClipboard(successInvite.inviteCode)
            if (success) {
                setCopiedCode(true)
                toast.success('Invite code copied to clipboard!')
                setTimeout(() => setCopiedCode(false), 2000)
            } else {
                toast.error('Failed to copy. Please copy manually.')
            }
        }

        const codeChars = successInvite.inviteCode.split('')

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas p-4 sm:p-6 lg:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-border p-8 flex flex-col items-center justify-center text-center relative animate-in fade-in zoom-in duration-300"
                >
                    <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-purple to-purple-dark pointer-events-none" />
                    
                    <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                        <Check className="h-8 w-8 stroke-[3px]" />
                    </div>

                    <h2 className="text-3xl font-extrabold font-display text-ink tracking-tight mb-2">
                        Workspace Created!
                    </h2>
                    <p className="text-ink-soft text-sm max-w-md mb-8">
                        Your workspace <span className="font-semibold text-purple">{successInvite.orgName}</span> is ready. 
                        Invite your teammates to join and start training your company's brain together!
                    </p>

                    <div className="w-full max-w-md bg-purple-soft/20 border border-purple/10 rounded-3xl p-6 mb-8 space-y-6">
                        {/* Invite Code Section */}
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-ink uppercase tracking-wider mb-3 block">Workspace Invite Code</span>
                            
                            {/* Giant readable boxes */}
                            <div className="flex justify-center gap-2.5 mb-4 select-all">
                                {codeChars.map((char, index) => (
                                    <div 
                                        key={index} 
                                        className="size-12 rounded-xl bg-white border border-purple/15 flex items-center justify-center text-lg font-black text-purple shadow-sm hover:border-purple/35 transition-all"
                                    >
                                        {char}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleCopyCode}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm border",
                                    copiedCode 
                                        ? "bg-emerald-500 border-emerald-500 text-white" 
                                        : "bg-white border-purple/10 text-purple hover:bg-purple-soft/5 active:scale-95 cursor-pointer"
                                )}
                            >
                                {copiedCode ? (
                                    <>
                                        <Check className="h-3.5 w-3.5" />
                                        Code Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy Invite Code
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="w-full h-[1px] bg-purple/10" />

                        {/* Invite Link Section */}
                        <div className="text-left">
                            <span className="text-[10px] font-bold text-ink uppercase tracking-wider block mb-2">Workspace Invite Link</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 bg-white border border-border h-11 px-3 rounded-xl text-xs text-ink font-mono focus:outline-none select-all"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className={cn(
                                        "h-11 px-4 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer",
                                        copiedLink 
                                            ? "bg-emerald-500 text-white" 
                                            : "bg-purple text-white hover:opacity-90 active:scale-95"
                                    )}
                                >
                                    {copiedLink ? (
                                        <>
                                            <Check className="h-3.5 w-3.5" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            Copy Link
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 items-center justify-center">
                        {navigator.share && (
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        await navigator.share({
                                            title: 'Join our Bubblespace Workspace',
                                            text: `Join our workspace "${successInvite.orgName}" on Bubblespace!`,
                                            url: inviteLink,
                                        })
                                        toast.success('Shared successfully!')
                                    } catch (err) {
                                        console.log('Error sharing:', err)
                                    }
                                }}
                                className="h-13 px-6 border border-purple text-purple font-bold rounded-xl hover:bg-purple/5 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm shrink-0"
                            >
                                Share Invite...
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => {
                                onComplete(successInvite.userData)
                            }}
                            className="h-13 px-8 bg-purple text-white font-bold rounded-xl shadow-lg shadow-purple/15 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            Enter Workspace
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    // Navigation indicators list
    const stepsList = isAdmin 
        ? [
            { id: 1, name: 'Personal Details' },
            { id: 2, name: 'Business Info' },
            { id: 3, name: 'Train AI Brain' }
          ]
        : [
            { id: 1, name: 'Personal Details' }
          ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-4xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl border border-border flex flex-col md:flex-row h-[85vh] max-h-[750px]"
            >
                {/* Left Progress Bar */}
                <div className="w-full md:w-[280px] bg-gradient-to-br from-purple to-purple-dark text-white p-8 flex flex-col justify-between relative overflow-hidden flex-shrink-0">
                    <div className="absolute inset-0 opacity-10 topographic-bg-refined" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                                <BubblespaceLogo className="h-6 w-6 text-white" />
                            </div>
                            <span className="font-display font-extrabold text-lg tracking-wider">BUBBLESPACE</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <span className="text-[10px] uppercase tracking-widest text-purple-light/70 font-bold">Onboarding Wizard</span>
                                <h2 className="text-xl font-bold font-display mt-0.5">Let's build your Bubblespace</h2>
                            </div>

                            {/* Stepper Steps */}
                            <div className="space-y-4 pt-6 border-t border-white/10">
                                {stepsList.map((s) => (
                                    <div key={s.id} className="flex items-center gap-3.5 group">
                                        <div className={`size-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                            step === s.id 
                                                ? 'bg-white text-purple shadow-lg scale-110' 
                                                : step > s.id 
                                                    ? 'bg-emerald-400 text-white' 
                                                    : 'bg-white/10 text-white/50 border border-white/10'
                                        }`}>
                                            {step > s.id ? <Check className="h-4 w-4 stroke-[3px]" /> : s.id}
                                        </div>
                                        <span className={`text-sm font-semibold transition-all duration-300 ${
                                            step === s.id ? 'text-white translate-x-1' : 'text-white/50'
                                        }`}>
                                            {s.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 text-xs text-purple-light/70">
                        {isAdmin ? 'Organization Administrator Account' : 'Individual Personal Account'}
                    </div>
                </div>

                {/* Right Form Panels */}
                <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto bg-slate-50/35 flex flex-col justify-between">
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold font-display text-ink">Personal Profile Details</h2>
                                        <p className="text-ink-soft text-sm mt-1">Set up your avatar and profile identifier details.</p>
                                    </div>

                                    <form onSubmit={handleNextStep} className="space-y-6">
                                        {/* Profile Picture */}
                                        <div className="flex items-center gap-6 group">
                                            <div className="relative">
                                                <div className="size-24 overflow-hidden rounded-[2rem] border-4 border-purple-soft bg-purple-soft/30 shadow-md transition-transform group-hover:scale-105 duration-300">
                                                    {avatarPreview ? (
                                                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-purple/40">
                                                            <User className="h-10 w-10" />
                                                        </div>
                                                    )}
                                                </div>
                                                <label className="absolute -bottom-2 -right-2 flex size-10 cursor-pointer items-center justify-center rounded-xl bg-purple text-white shadow-lg shadow-purple/20 transition-all hover:scale-110 active:scale-95 duration-200">
                                                    <Camera className="h-5 w-5" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                                </label>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-ink text-sm">Avatar Photo</h3>
                                                <p className="text-xs text-ink-soft mt-1">Upload a professional photo for notifications.</p>
                                                {user?.username && (
                                                    <p className="text-xs text-purple font-bold mt-1.5 bg-purple/10 px-2 py-0.5 rounded-md inline-block">@{user.username}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Full Name</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple" />
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full bg-white border border-border rounded-xl py-3 pl-11 pr-4 text-ink focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all text-sm"
                                                        placeholder="e.g. Desmond Ubi"
                                                        value={formData.full_name}
                                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Phone Number</label>
                                                <div className="relative flex items-center">
                                                    {/* Country Selector Dropdown */}
                                                    <div className="absolute left-1.5 z-10 flex items-center h-full">
                                                        <select
                                                            value={selectedCountryCode}
                                                            onChange={(e) => {
                                                                const code = e.target.value
                                                                setSelectedCountryCode(code)
                                                                const matched = countries.find(c => c.code === code)
                                                                if (matched) {
                                                                    setFormData(prev => {
                                                                        const oldVal = prev.phone_number
                                                                        if (oldVal.startsWith('+')) {
                                                                            const prevMatch = countries.find(c => oldVal.startsWith(c.dial_code))
                                                                            if (prevMatch) {
                                                                                return {
                                                                                    ...prev,
                                                                                    phone_number: oldVal.replace(prevMatch.dial_code, matched.dial_code)
                                                                                }
                                                                            }
                                                                        }
                                                                        return {
                                                                            ...prev,
                                                                            phone_number: matched.dial_code + ' ' + oldVal.replace(/^\+\d+\s*/, '')
                                                                        }
                                                                    })
                                                                }
                                                            }}
                                                            className="opacity-0 absolute inset-0 cursor-pointer w-14 h-8"
                                                        >
                                                            {countries.map(c => (
                                                                <option key={c.code} value={c.code}>
                                                                    {c.flag} {c.name} ({c.dial_code})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-transparent text-sm pointer-events-none select-none animate-in fade-in duration-200">
                                                            <span className="text-lg">{(countries.find(c => c.code === selectedCountryCode) || countries[0]).flag}</span>
                                                            <span className="text-[11px] text-ink-soft font-bold">{(countries.find(c => c.code === selectedCountryCode) || countries[0]).dial_code}</span>
                                                        </div>
                                                        <div className="w-[1px] h-5 bg-border mx-0.5" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        className="w-full bg-white border border-border rounded-xl py-3 pl-20 pr-4 text-ink focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all text-sm font-semibold"
                                                        placeholder="e.g. 812 345 6789"
                                                        value={formData.phone_number}
                                                        onChange={e => {
                                                            const val = e.target.value
                                                            setFormData({ ...formData, phone_number: val })
                                                            if (val.startsWith('+')) {
                                                                const matched = countries.find(c => val.startsWith(c.dial_code))
                                                                if (matched && matched.code !== selectedCountryCode) {
                                                                    setSelectedCountryCode(matched.code)
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Organization</label>
                                                    <div className="relative">
                                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple" />
                                                        <input
                                                            required
                                                            type="text"
                                                            className="w-full bg-white border border-border rounded-xl py-3 pl-11 pr-4 text-ink focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all text-sm"
                                                            placeholder="Company Name"
                                                            value={formData.organization}
                                                            onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Your Role</label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple" />
                                                        <select
                                                            required
                                                            className="w-full bg-white border border-border rounded-xl py-3 pl-11 pr-4 text-ink focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all text-sm appearance-none"
                                                            value={formData.org_role}
                                                            onChange={e => setFormData({ ...formData, org_role: e.target.value })}
                                                        >
                                                            <option value="">Select Role</option>
                                                            {OFFICE_ROLES.map(role => (
                                                                <option key={role} value={role}>{role}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Short Bio</label>
                                            <textarea
                                                className="w-full bg-white border border-border rounded-xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none transition-all min-h-[90px] resize-none text-sm"
                                                placeholder="Write a brief professional tagline about yourself..."
                                                value={formData.bio}
                                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            />
                                        </div>

                                        {/* Inline Loading Banner */}
                                        {loading && uploadProgress && (
                                            <div className="flex items-center gap-3 bg-purple-soft/20 text-purple border border-purple/15 rounded-xl p-3 text-xs font-semibold animate-pulse mb-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {uploadProgress}
                                            </div>
                                        )}

                                        <div className="pt-4 flex items-center justify-between">
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={handleBackToAuth}
                                                className="h-12 px-6 border border-border hover:bg-slate-50 font-bold rounded-xl transition-all flex items-center gap-2 text-ink-soft text-sm disabled:opacity-50"
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full sm:w-auto min-w-[150px] h-12 bg-purple text-white font-bold rounded-xl shadow-lg shadow-purple/15 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        {isAdmin ? 'Next Step' : 'Complete Setup'}
                                                        {isAdmin ? <ArrowRight className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {step === 2 && isAdmin && (
                                <motion.div
                                    key="step2Admin"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold font-display text-ink">Describe Your Business</h2>
                                        <p className="text-ink-soft text-sm mt-1">Aida uses these details to train and initialize your company's brain.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Company Size</label>
                                                <select
                                                    value={orgSize}
                                                    onChange={e => setOrgSize(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink text-sm outline-none focus:ring-2 focus:ring-purple/20 transition-all appearance-none"
                                                >
                                                    <option value="">Select Size</option>
                                                    <option value="solo">Solo (1 employee)</option>
                                                    <option value="2-10">2-10 employees</option>
                                                    <option value="11-50">11-50 employees</option>
                                                    <option value="51-200">51-200 employees</option>
                                                    <option value="201-500">201-500 employees</option>
                                                    <option value="500+">500+ employees</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Industry Segment</label>
                                                <select
                                                    value={orgIndustry}
                                                    onChange={e => setOrgIndustry(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink text-sm outline-none focus:ring-2 focus:ring-purple/20 transition-all appearance-none"
                                                >
                                                    <option value="">Select Industry</option>
                                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-ink uppercase tracking-wider ml-0.5">Tell us about your organization</label>
                                            <textarea
                                                required
                                                className="w-full bg-white border border-border rounded-xl p-4 text-ink focus:ring-2 focus:ring-purple/20 focus:border-purple outline-none min-h-[160px] resize-none text-sm leading-relaxed"
                                                placeholder="Describe your organization details: target market, core services/products, strategic goals, or team processes. Be as detailed as possible to train the company's brain!"
                                                value={businessDesc}
                                                onChange={e => setBusinessDesc(e.target.value)}
                                            />
                                        </div>

                                        <div className="pt-4 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                className="h-12 px-6 border border-border hover:bg-slate-50 font-bold rounded-xl transition-all flex items-center gap-2 text-ink-soft text-sm"
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                Back
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStep(3)}
                                                className="h-12 px-6 bg-purple text-white font-bold rounded-xl shadow-lg shadow-purple/15 hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 text-sm"
                                            >
                                                Next Step
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}



                            {step === 3 && isAdmin && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <h2 className="text-2xl font-bold font-display text-ink">Train Your Collective Brain</h2>
                                        <p className="text-ink-soft text-sm mt-1">Upload business documents to train the company's brain (supports .txt, .md, .csv, .json).</p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Drag and Drop Zone */}
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-purple/35 rounded-2xl p-6 flex flex-col items-center justify-center bg-purple-soft/5 hover:bg-purple-soft/10 cursor-pointer transition-all duration-300 group"
                                        >
                                            <input 
                                                type="file" 
                                                multiple 
                                                className="hidden" 
                                                ref={fileInputRef}
                                                accept=".txt,.md,.json,.csv"
                                                onChange={handleFileChange}
                                            />
                                            <div className="size-12 rounded-xl bg-purple-soft/40 flex items-center justify-center text-purple transition-transform group-hover:scale-110 duration-200">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <span className="font-bold text-ink mt-3 text-sm">Select files or drag here</span>
                                            <span className="text-[10px] text-ink-soft mt-1">Supports Text, Markdown, CSV, and JSON (max 5MB)</span>
                                        </div>

                                        {/* Uploaded Documents List */}
                                        {documents.length > 0 && (
                                            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                                <div className="text-[10px] font-bold text-ink uppercase tracking-wider">Loaded Files ({documents.length})</div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {documents.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white border border-border p-2.5 rounded-xl text-xs shadow-sm">
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <FileText className="h-4 w-4 text-purple flex-shrink-0" />
                                                                <span className="font-semibold text-ink truncate">{doc.name}</span>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => handleRemoveDoc(idx)}
                                                                className="text-muted-foreground hover:text-red-500 p-0.5 hover:bg-slate-50 rounded-lg transition-colors"
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Loading State Info */}
                                    {loading && uploadProgress && (
                                        <div className="flex items-center gap-3 bg-purple-soft/20 text-purple border border-purple/15 rounded-xl p-3 text-xs font-semibold animate-pulse">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {uploadProgress}
                                        </div>
                                    )}

                                    <div className="pt-4 flex items-center justify-between">
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={() => setStep(2)}
                                            className="h-12 px-6 border border-border hover:bg-slate-50 font-bold rounded-xl transition-all flex items-center gap-2 text-ink-soft text-sm disabled:opacity-50"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            disabled={loading}
                                            onClick={handleCompleteWithOrg}
                                            className="h-12 min-w-[180px] bg-purple text-white font-bold rounded-xl shadow-lg shadow-purple/15 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Train Brain & Finish
                                                    <Sparkles className="h-4 w-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
