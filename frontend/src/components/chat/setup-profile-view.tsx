import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Sparkles, User, Briefcase, Phone, Mail, Camera, Loader2 } from 'lucide-react'
import { setupProfile, uploadAvatar } from '@/lib/api'
import { toast } from 'sonner'
import { BubblespaceLogo } from '../logo'

export function SetupProfileView({
    user,
    onComplete
}: {
    user: any,
    onComplete: (updatedUser: any) => void
}) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        bio: '',
        organization: '',
        org_role: '',
        phone_number: '',
    })
    const [avatar, setAvatar] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '')

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAvatar(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            let finalAvatar = user?.avatar
            if (avatar) {
                const uploadRes = await uploadAvatar(avatar)
                finalAvatar = uploadRes.data.avatarUrl
            }

            const res = await setupProfile({
                ...formData,
                avatar: finalAvatar,
            })
            toast.success('Profile setup complete!')
            onComplete(res.data)
        } catch (err: any) {
            toast.error(err.message || 'Setup failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas p-4 sm:p-6 lg:p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl overflow-hidden rounded-[40px] bg-white shadow-2xl"
            >
                <div className="flex flex-col md:flex-row h-full">
                    {/* Left Side - Deco */}
                    <div className="relative hidden md:flex w-1/3 flex-col items-center justify-center bg-gradient-to-br from-purple to-purple-dark p-8 text-white text-center">
                        <div className="absolute inset-0 opacity-20 topographic-bg-refined" />
                        <div className="relative z-10">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                                <BubblespaceLogo className="h-10 w-10 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold font-display">Welcome to Bubble Space</h1>
                            <p className="mt-4 text-sm text-purple-light/80 leading-relaxed">
                                Let's set up your professional identity to get started.
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="flex-1 p-8 sm:p-10 lg:p-12 overflow-y-auto max-h-[90vh]">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-ink">Complete Your Profile</h2>
                            <p className="mt-1 text-ink-soft text-sm">Tell us a bit about yourself</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Avatar Upload */}
                            <div className="flex items-center gap-6 group">
                                <div className="relative">
                                    <div className="size-24 overflow-hidden rounded-[28px] border-4 border-purple-soft bg-purple-soft/30 transition-transform group-hover:scale-105">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-purple/40">
                                                <User className="h-10 w-10" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 flex size-10 cursor-pointer items-center justify-center rounded-full bg-purple text-white shadow-lg transition-transform hover:scale-110 active:scale-95">
                                        <Camera className="h-5 w-5" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-bold text-ink">Profile Photo</h3>
                                    <p className="text-xs text-ink-soft mt-1">Upload a clear photo for your connections</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-ink uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 pl-11 pr-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none"
                                            placeholder="e.g. Tanisha Combs"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-ink uppercase tracking-wider">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple" />
                                        <input
                                            required
                                            type="tel"
                                            className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 pl-11 pr-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none"
                                            placeholder="e.g. +1 202 555 0100"
                                            value={formData.phone_number}
                                            onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-ink uppercase tracking-wider">Organization</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 pl-11 pr-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none"
                                            placeholder="Company Name"
                                            value={formData.organization}
                                            onChange={e => setFormData({ ...formData, organization: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-ink uppercase tracking-wider">Role</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-purple" />
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 pl-11 pr-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none"
                                            placeholder="e.g. Lead Designer"
                                            value={formData.org_role}
                                            onChange={e => setFormData({ ...formData, org_role: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-ink uppercase tracking-wider">Bio</label>
                                <textarea
                                    className="w-full bg-purple-soft/30 border-none rounded-2xl py-3 px-4 text-ink focus:ring-2 focus:ring-purple/20 transition-all outline-none min-h-[100px] resize-none"
                                    placeholder="Share a bit about your professional background..."
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto min-w-[160px] h-14 bg-purple text-white font-bold rounded-2xl shadow-lg shadow-purple/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            Complete Setup
                                            <Sparkles className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
