// import React from 'react'
// import { Camera, Github, Globe, Linkedin, X, Trash2 } from 'lucide-react'
// import { useState, useEffect, useContext, useRef } from 'react'
// import { useForm } from 'react-hook-form'
// import { AppContext } from '../../context/AppContext'
// import { toast } from 'react-toastify'
// import LoadingPage from '../LoadingPage.jsx'   
// import { assets } from '../../assets/assets.js'

// const ProfilePage = () => {

//     const {navigate, user, loading, updateProfile}= useContext(AppContext);
    
//     const {register, handleSubmit, formState: {errors}, reset}= useForm();

//     // Default Values for the form fields based on user data
//     useEffect(() => {
//         if(user){
//             reset({
//             firstName: user.firstName || '',
//             lastName: user.lastName || '',
//             username: user.username || '',
//             bio: user.bio || '',
//             githubUrl: user.githubUrl || '',
//             linkedinUrl: user.linkedinUrl || '',
//             portfolioUrl: user.portfolioUrl || '',
//             });
//         }
//     }, [user, reset]);

//     const fileInputRef= useRef(null);
    
//     const [previewImage, setPreviewImage]= useState(null);

//     const handleImageChange= (e)=>{
//         const file= e.target.files[0];
//         if(!file) return;
//         if(file.size() > 5*1024*1024){
//             toast.error("File size should be less than 5MB");
//             return;
//         }
//         setPreviewImage(URL.createObjectURL(file));
//     }

//     const handleRemoveChange= ()=>{
//         setPreviewImage(null);
//         if(fileInputRef.current){
//             fileInputRef.current.value= "";
//         }
//         return;
//     }

//     const handleRemoveAvatar= ()=>{
//         // api call to remove avatar from server
//         updateProfile({ avatar: '' });
//     }

//     const onSubmit= (data)=>{

//         const formData= new FormData();

//         formData.append('firstName', data.firstName);
//         formData.append('lastName', data.lastName);
//         formData.append('bio', data.bio);
//         formData.append('githubUrl', data.githubUrl);
//         formData.append('linkedinUrl', data.linkedinUrl);
//         formData.append('portfolioUrl', data.portfolioUrl);
        
//         if(fileInputRef.current && fileInputRef.current.files[0]){
//             formData.append('avatar', fileInputRef.current.files[0]);
//         }
        
//         updateProfile(formData);
//     }

//     const handleCancel= ()=>{
//         reset();
//         setPreviewImage(null);
//         if(fileInputRef.current){
//             fileInputRef.current.value= "";
//         }
//     }

//     if(loading) return <LoadingPage />;
//     if(!user) return navigate('login');

//   return (
//     <form onSubmit={handleSubmit(onSubmit)}>
//         {/* Page Header */}
//         <h2>Profile</h2>
//         <p>Manage your personal information and how others see you.</p>

//         {/* ── Profile Picture Card ── */}
//         <div>
//             <div>
//                 <h3>Profile Picture</h3>
//                 <div>
//                     <p>MEMBER SINCE</p>
//                     <p>{user.memberSince || 'N/A'}</p>
//                 </div>
//             </div>

//             {/* Avatar with remove button */}
//             <div>
//                 <div>
//                     <img src={previewImage || user?.avatar || assets.default_avatar} alt="Profile Picture" />
//                     {previewImage && (
//                         <button type="button" onClick={handleRemoveChange}>
//                             <X size={12} />
//                         </button>
//                     )}
//                 </div>
//                 {/* Upload control */}
//                 <div>
//                     <input type="file" ref={fileInputRef} onChange={handleImageChange} hidden accept='image/*' />
//                     <button type="button" onClick={()=> fileInputRef.current?.click()}>
//                         <Camera size={14}></Camera>
//                         <span>Upload Image</span>
//                     </button>

//                     {/* Show Remove button only when user has a saved avatar and no fresh preview */}
//                     {!previewImage && user.avatar && (
//                     <button type="button" onClick={handleRemoveAvatar}>
//                         <Trash2 size={14} />
//                         <span>Remove Photo</span>
//                     </button>
//                     )}
//                     <p>JPG, PNG or GIF. Max size 5MB.</p>
//                 </div>
//             </div>
//         </div>

//         {/* ── Personal Information Card ── */}
//         <div>
//             <h3>Personal Information</h3>

//             {/* First + Last Name (side by side) */}
//             <div>
//                 <div>
//                     <label>FirstName</label>
//                     <input type="text" {...register("firstName", { required: 'First name is required' })} placeholder="Enter your first name"  />

//                     {errors.firstName && <p>{errors.firstName.message}</p>}
//                 </div>

//                 <div>
//                     <label>LastName</label>
//                     <input type="text" {...register("lastName", { required: 'Last name is required' })} placeholder="Enter your last name"  />

//                     {errors.lastName && <p>{errors.lastName.message}</p>}
//                 </div>
//             </div>
            
//             {/* Bio */}
//             <div>
//                 <label>Bio</label>
//                 <textarea {...register("bio", {maxLength: {value: 200, message: 'Bio must be 200 characters or less'}})} placeholder="Tell us about yourself..." />
//                 {errors.bio && <p>{errors.bio.message}</p>}
//             </div>
//         </div>

//         {/* ── Social Links Card ── */}
//         <div>
//             <h3>Social Links</h3>
//             <div>
//             <label><Github size={14} /> GitHub URL</label>
//             <input
//                 type="url"
//                 {...register('githubUrl', {
//                 pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
//                 })}
//                 placeholder="https://github.com/username"
//             />
//             {errors.githubUrl && <p>{errors.githubUrl.message}</p>}
//             </div>

//             <div>
//                 <label><Linkedin size={14} /> LinkedIn URL</label>
//                 <input
//                     type="url"
//                     {...register('linkedinUrl', {
//                     pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
//                     })}
//                     placeholder="https://linkedin.com/in/username"
//                 />
//                 {errors.linkedinUrl && <p>{errors.linkedinUrl.message}</p>}
//             </div>

//             <div>
//                 <label><Globe size={14} /> Portfolio Website</label>
//                 <input
//                     type="url"
//                     {...register('portfolioUrl', {
//                     pattern: { value: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/, message: 'Enter a valid URL' },
//                     })}
//                     placeholder="https://yoursite.com"
//                 />
//                 {errors.portfolioUrl && <p>{errors.portfolioUrl.message}</p>}
//             </div>
//         </div>

//         {/* ── Action Buttons ── */}
//       <div>
//         <button type="button" onClick={handleCancel}>Cancel</button>
//         <button type="submit">Save Changes</button>
//       </div>
//     </form>
//   )
// }

// export default ProfilePage

import React from 'react'
import { Camera, Eye, EyeOff, Github, Globe, Linkedin, X, Trash2 } from 'lucide-react'
import { useState, useEffect, useContext, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import LoadingPage from '../LoadingPage.jsx'
import { assets } from '../../assets/assets.js'

const ProfilePage = () => {

    const { navigate, user, updateProfile } = useContext(AppContext);
    const [loading, setLoading]= useState(false);
    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    useEffect(() => {
        if (user) {
            reset({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                bio: user.bio || '',
                githubUrl: user.githubUrl || '',
                linkedinUrl: user.linkedinUrl || '',
                portfolioUrl: user.portfolioUrl || '',
            });
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
        updateProfile({ profilePicture: '' });
    };

    // STEP 1: RHF validates all fields first, then opens the password popup
    // `data` is saved to pendingFormData so it's available when user confirms
    const onValidated = (data) => {
        setPendingFormData(data);
        setShowPasswordPopup(true);
    };

    // STEP 2: Called when user clicks "Confirm" in popup — password is now available
    const onConfirm = () => {
        if (!password) {
            toast.error("Please enter your password");
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
        }

        updateProfile(formData);

        // Clean up popup state
        setShowPasswordPopup(false);
        setPassword('');
        setPendingFormData(null);
    };

    const handleClosePopup = () => {
        setShowPasswordPopup(false);
        setPassword('');
        setPendingFormData(null);
    };

    const handleCancel = () => {
        reset();
        setPreviewImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (loading) return <LoadingPage />;
    if (!user) return navigate('/login');

    return (
        // STEP 1 is triggered here — RHF validates, then calls onValidated
        <form onSubmit={handleSubmit(onValidated)} className="max-w-2xl mx-auto px-4 py-8 space-y-6">

            {/* ── Page Header ── */}
            <div>
                <h2 className="text-2xl font-semibold text-slate-800">Profile</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your personal information and how others see you.</p>
            </div>

            {/* ── Profile Picture Card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-700">Profile Picture</h3>
                    <div className="text-right">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Member Since</p>
                        <p className="text-sm font-medium text-slate-600">{user.memberSince || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                        <img
                            src={previewImage || user?.profilePicture || assets.default_profile_picture}
                            alt="Profile Picture"
                            className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200"
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
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                        >
                            <Camera size={14} />
                            <span>Upload Image</span>
                        </button>

                        {!previewImage && user.profilePicture && (
                            <button
                                type="button"
                                onClick={handleRemoveProfilePicture}
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-semibold text-slate-700">Personal Information</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">First Name</label>
                        <input
                            type="text"
                            {...register("firstName", { required: 'First name is required' })}
                            placeholder="Enter your first name"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                        />
                        {errors.firstName && <p className="text-xs text-rose-500">{errors.firstName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Last Name</label>
                        <input
                            type="text"
                            {...register("lastName", { required: 'Last name is required' })}
                            placeholder="Enter your last name"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                        />
                        {errors.lastName && <p className="text-xs text-rose-500">{errors.lastName.message}</p>}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Bio</label>
                    <textarea
                        {...register("bio", { maxLength: { value: 200, message: 'Bio must be 200 characters or less' } })}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition resize-none h-24"
                    />
                    {errors.bio && <p className="text-xs text-rose-500">{errors.bio.message}</p>}
                </div>
            </div>

            {/* ── Social Links Card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
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
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
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
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
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
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                    />
                    {errors.portfolioUrl && <p className="text-xs text-rose-500">{errors.portfolioUrl.message}</p>}
                </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                {/* type="submit" triggers RHF validation → onValidated → opens popup */}
                <button
                    type="submit"
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors shadow-sm"
                >
                    Save Changes
                </button>
            </div>

            {/* ── Password Confirmation Popup ── */}
            {showPasswordPopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
                    onClick={handleClosePopup}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5"
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
                                    className="w-full px-3.5 py-2.5 pr-11 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 transition"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
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
                                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={!password}
                                className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
                            >
                                Confirm & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};

export default ProfilePage;