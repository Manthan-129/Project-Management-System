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
        <form onSubmit={handleSubmit(onValidated)} className="relative max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-hidden">

            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-teal-400/15 rounded-full blur-3xl -z-10"></div>

            <div className="bg-white/90 border border-blue-100 rounded-3xl p-5 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profile Summary</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        @{user?.username || 'username'}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {user?.email || 'No email'}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Since: {user?.memberSince || 'N/A'}
                    </span>
                </div>
            </div>

            {/* ── Profile Picture Card ── */}
            <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(20,184,166,0.45)] space-y-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-700">Profile Picture</h3>
                    <div className="text-right">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Member Since</p>
                        <p className="text-sm font-medium text-slate-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                        <img
                            src={previewImage || user?.profilePicture || assets.default_profile_picture}
                            alt="Profile Picture"
                            className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-100 shadow-md"
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
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                        >
                            <Camera size={14} />
                            <span>Upload Image</span>
                        </button>

                        {!previewImage && user.profilePicture && (
                            <button
                                type="button"
                                onClick={handleRemoveProfilePicture}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                            >
                                <Trash2 size={14} />
                                <span>Remove Photo</span>
                            </button>
                        )}
                        <p className="text-xs text-slate-400">JPG, PNG or GIF. Max size 5MB.</p>
                    </div>
                </div>
            </div>

            {/* ── Personal Information Card ── */}
            <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] space-y-4 backdrop-blur-sm">
                <h3 className="text-base font-semibold text-slate-700">Personal Information</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">First Name</label>
                        <input
                            type="text"
                            {...register("firstName", { required: 'First name is required' })}
                            placeholder="Enter your first name"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                        />
                        {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Last Name</label>
                        <input
                            type="text"
                            {...register("lastName", { required: 'Last name is required' })}
                            placeholder="Enter your last name"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                        />
                        {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Bio</label>
                    <textarea
                        {...register("bio", { maxLength: { value: 200, message: 'Bio must be 200 characters or less' } })}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition resize-none h-24"
                    />
                    {errors.bio && <p className="text-xs text-rose-500">{errors.bio.message}</p>}
                </div>
            </div>

            {/* ── Social Links Card ── */}
            <div className="bg-white/90 border border-blue-100 rounded-3xl p-6 shadow-[0_16px_45px_-35px_rgba(37,99,235,0.4)] space-y-4 backdrop-blur-sm">
                <h3 className="text-base font-semibold text-slate-700">Social Links</h3>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        <Github size={14} /> GitHub URL
                    </label>
                    <input
                        type="url"
                        {...register('githubUrl', {
                            pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
                        })}
                        placeholder="https://github.com/username"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    />
                    {errors.githubUrl && <p className="text-xs text-rose-500">{errors.githubUrl.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        <Linkedin size={14} /> LinkedIn URL
                    </label>
                    <input
                        type="url"
                        {...register('linkedinUrl', {
                            pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
                        })}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    />
                    {errors.linkedinUrl && <p className="text-xs text-rose-500">{errors.linkedinUrl.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        <Globe size={14} /> Portfolio Website
                    </label>
                    <input
                        type="url"
                        {...register('portfolioUrl', {
                            pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
                        })}
                        placeholder="https://yoursite.com"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                    />
                    {errors.portfolioUrl && <p className="text-xs text-rose-500">{errors.portfolioUrl.message}</p>}
                </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    Discard Changes
                </button>
                {/* type="submit" triggers RHF validation → onValidated → opens popup */}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600 rounded-xl transition-all shadow-lg shadow-blue-900/20"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {/* ── Password Confirmation Popup ── */}
            {showPasswordPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    onClick={handleClosePopup}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5 border border-blue-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Popup Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h4 className="text-base font-semibold text-slate-800">Confirm Changes</h4>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    Enter your password to save your profile updates.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClosePopup}
                                className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Decorative divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                                Your Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    // Allow pressing Enter to confirm
                                    onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
                                    className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isSaving}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Popup Action Buttons */}
                        <div className="flex gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleClosePopup}
                                disabled={isSaving}
                                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={!password || isSaving}
                                className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-blue-900/20"
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