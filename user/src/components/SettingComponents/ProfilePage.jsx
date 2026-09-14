import { Camera, Eye, EyeOff, Github, Globe, Linkedin, Trash2, X } from 'lucide-react'
import { useContext, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets.js'
import { AppContext } from '../../context/AppContext'
import LoadingPage from '../LoadingPage.jsx'

const ProfilePage = () => {

    const { user, updateProfile } = useContext(AppContext);
    const [isSaving, setIsSaving]= useState(false);
    const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm();

    const resetToUserSnapshot = (targetUser) => {
        if (!targetUser) return;

        reset({
            firstName: targetUser.firstName || '',
            lastName: targetUser.lastName || '',
            username: targetUser.username || '',
            bio: targetUser.bio || '',
            githubUrl: targetUser.githubUrl || '',
            linkedinUrl: targetUser.linkedinUrl || '',
            portfolioUrl: targetUser.portfolioUrl || '',
        });
    };

    useEffect(() => {
        if (user) {
            resetToUserSnapshot(user);
        }
    }, [user, reset]);

    const fileInputRef = useRef(null);

    const [previewImage, setPreviewImage] = useState(null);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');

    // Stores the validated RHF form data temporarily while user enters password in popup
    const [pendingFormData, setPendingFormData] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }
        setPreviewImage(URL.createObjectURL(file));
    };

    const handleRemoveChange = () => {
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveProfilePicture = () => {
        const values = getValues();
        setPendingFormData({
            firstName: values.firstName || '',
            lastName: values.lastName || '',
            bio: values.bio || '',
            githubUrl: values.githubUrl || '',
            linkedinUrl: values.linkedinUrl || '',
            portfolioUrl: values.portfolioUrl || '',
            removeProfilePicture: true,
        });
        setShowPasswordPopup(true);
    };

    // STEP 1: RHF validates all fields first, then opens the password popup
    // `data` is saved to pendingFormData so it's available when user confirms
    const onValidated = (data) => {
        setPendingFormData(data);
        setShowPasswordPopup(true);
    };

    // STEP 2: Called when user clicks "Confirm" in popup — password is now available
    const onConfirm = async () => {
        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        if (!pendingFormData) {
            toast.error("No pending profile changes found");
            return;
        }

        const formData = new FormData();
        formData.append('firstName', pendingFormData.firstName);
        formData.append('lastName', pendingFormData.lastName);
        formData.append('bio', pendingFormData.bio);
        formData.append('githubUrl', pendingFormData.githubUrl);
        formData.append('linkedinUrl', pendingFormData.linkedinUrl);
        formData.append('portfolioUrl', pendingFormData.portfolioUrl);
        formData.append('password', password);

        if (fileInputRef.current && fileInputRef.current.files[0]) {
            formData.append('profilePicture', fileInputRef.current.files[0]);
        } else if (pendingFormData.removeProfilePicture) {
            formData.append('profilePicture', '');
        }

        try {
            setIsSaving(true);
            const data = await updateProfile(formData);



            if (pendingFormData.removeProfilePicture) {
                setPreviewImage(null);
            }

            // Clean up popup state
            setShowPasswordPopup(false);
            setPassword('');
            setPendingFormData(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            if (error?.response?.status === 401) {
                // logout() is usually handled by the context or a parent,
                // but we should at least not show the generic failure toast.
                return;
            }
            toast.error(error?.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClosePopup = () => {
        setShowPasswordPopup(false);
        setPassword('');
        setPendingFormData(null);
    };

    const handleCancel = () => {
        resetToUserSnapshot(user);
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (isSaving) return <LoadingPage />;
    if (!user) return <LoadingPage />;

    return (
        // STEP 1 is triggered here — RHF validates, then calls onValidated
        <form onSubmit={handleSubmit(onValidated)} className="relative max-w-3xl mx-auto space-y-6">

            <div className="dd-section-card p-4">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Profile Summary</span>
                    <span className="dd-badge border-indigo-100 bg-indigo-50 text-indigo-700">
                        @{user?.username || 'username'}
                    </span>
                    <span className="dd-badge border-slate-200 bg-slate-50 text-slate-600">
                        {user?.email || 'No email'}
                    </span>
                    <span className="dd-badge border-slate-200 bg-slate-50 text-slate-500">
                        Since: {user?.memberSince || 'N/A'}
                    </span>
                </div>
            </div>

            {/* Profile Picture Card */}
            <div className="dd-section-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Profile Picture</h3>
                        <p className="text-xs text-slate-500">Update your avatar displayed across workspaces.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Member Since</p>
                        <p className="text-xs font-semibold text-slate-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                        <img
                            src={previewImage || user?.profilePicture || assets.default_profile_picture}
                            alt="Profile Picture"
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                        />
                        {previewImage && (
                            <button
                                type="button"
                                onClick={handleRemoveChange}
                                className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow transition-colors"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} hidden accept="image/*" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSaving}
                            className="dd-ghost-button !px-3.5 !py-2 text-xs"
                        >
                            <Camera size={14} className="text-slate-500" />
                            <span>Upload Image</span>
                        </button>

                        {!previewImage && user.profilePicture && (
                            <button
                                type="button"
                                onClick={handleRemoveProfilePicture}
                                disabled={isSaving}
                                className="dd-danger-button !px-3.5 !py-2 text-xs ml-2"
                            >
                                <Trash2 size={14} />
                                <span>Remove Photo</span>
                            </button>
                        )}
                        <p className="text-[11px] text-slate-400">JPG, PNG, WebP or GIF. Maximum size 5MB.</p>
                    </div>
                </div>
            </div>

            {/* Personal Information Card */}
            <div className="dd-section-card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Personal Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">First Name *</label>
                        <input
                            type="text"
                            {...register("firstName", { required: 'First name is required' })}
                            placeholder="Enter your first name"
                            className="dd-input"
                        />
                        {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Last Name *</label>
                        <input
                            type="text"
                            {...register("lastName", { required: 'Last name is required' })}
                            placeholder="Enter your last name"
                            className="dd-input"
                        />
                        {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Bio</label>
                    <textarea
                        {...register("bio", { maxLength: { value: 200, message: 'Bio must be 200 characters or less' } })}
                        placeholder="Tell your team about yourself..."
                        className="dd-input resize-none h-24"
                    />
                    {errors.bio && <p className="text-xs text-rose-500">{errors.bio.message}</p>}
                </div>
            </div>

            {/* Social Links Card */}
            <div className="dd-section-card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Social Links</h3>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Github size={14} className="text-slate-500" /> GitHub URL
                    </label>
                    <input
                        type="url"
                        {...register('githubUrl', {
                            pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
                        })}
                        placeholder="https://github.com/username"
                        className="dd-input"
                    />
                    {errors.githubUrl && <p className="text-xs text-rose-500">{errors.githubUrl.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Linkedin size={14} className="text-sky-600" /> LinkedIn URL
                    </label>
                    <input
                        type="url"
                        {...register('linkedinUrl', {
                            pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
                        })}
                        placeholder="https://linkedin.com/in/username"
                        className="dd-input"
                    />
                    {errors.linkedinUrl && <p className="text-xs text-rose-500">{errors.linkedinUrl.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <Globe size={14} className="text-teal-600" /> Portfolio Website
                    </label>
                    <input
                        type="url"
                        {...register('portfolioUrl', {
                            pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
                        })}
                        placeholder="https://yoursite.com"
                        className="dd-input"
                    />
                    {errors.portfolioUrl && <p className="text-xs text-rose-500">{errors.portfolioUrl.message}</p>}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="dd-ghost-button"
                >
                    Discard Changes
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="dd-primary-button"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* Password Confirmation Popup */}
            {showPasswordPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4 dd-fade-in"
                    onClick={handleClosePopup}
                >
                    <div
                        className="w-full max-w-md rounded-2xl border border-[#1b3a5c] bg-[#0c1f38] p-6 space-y-4 text-white shadow-[0_25px_60px_rgba(0,0,0,0.5)] dd-fade-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Popup Header */}
                        <div className="flex items-start justify-between gap-3 border-b border-[#1b3a5c] pb-3">
                            <div>
                                <h4 className="text-base font-bold text-white">Confirm Changes</h4>
                                <p className="text-xs text-slate-300 mt-0.5">
                                    Enter your password to verify and save profile updates.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClosePopup}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-[#132d52] rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                Your Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your current password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
                                    className="dd-input pr-10"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isSaving}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Popup Action Buttons */}
                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1b3a5c]">
                            <button
                                type="button"
                                onClick={handleClosePopup}
                                disabled={isSaving}
                                className="rounded-xl border border-[#1b3a5c] bg-[#0a1829] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-[#132d52] hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={!password || isSaving}
                                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Confirm & Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export default ProfilePage;