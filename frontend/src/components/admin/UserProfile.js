import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { FiUser, FiMail, FiShield, FiCheckCircle, FiEdit2, FiSave, FiX, FiPhone, FiBriefcase, FiMapPin, FiGrid, FiCalendar, FiHome, FiFileText, FiCamera } from 'react-icons/fi';
import PremiumLoader from '../PremiumLoader';

const InputField = ({ label, type="text", value, onChange }) => (
    <div className="mb-4">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
        <input 
            type={type}
            value={value} 
            onChange={onChange}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)] outline-none transition-all font-semibold text-gray-800 text-[14px] shadow-sm"
        />
    </div>
);

const DisplayField = ({ icon: Icon, label, value }) => (
    <div className="flex items-start bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="mt-0.5 p-2 rounded-lg mr-3" style={{ backgroundColor: 'var(--theme-secondary)', color: 'var(--theme-primary)' }}>
            <Icon size={18}/>
        </div>
        <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="font-semibold text-gray-800 text-[14px] break-words">{value || <span className="text-gray-300 italic font-mono text-[12px]">N/A</span>}</p>
        </div>
    </div>
);

function UserProfile({ token }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);
    const [avatarUploadStatus, setAvatarUploadStatus] = useState('');

    const [editForm, setEditForm] = useState({ 
        first_name: '', last_name: '', phone_number: '', job_title: '', department: '', location: '',
        dob: '', address_temporary: '', address_permanent: '', pan_number: '', aadhar_number: '', uan: ''
    });
    const [saveStatus, setSaveStatus] = useState('');

    const fetchUserData = async () => {
        try {
            const res = await api.get('/users/me');
            setUserData(res.data);
            setEditForm({ 
                first_name: res.data.first_name || '', 
                last_name: res.data.last_name || '',
                phone_number: res.data.phone_number || '',
                job_title: res.data.job_title || '',
                department: res.data.department || '',
                location: res.data.location || '',
                dob: res.data.dob || '',
                address_temporary: res.data.address_temporary || '',
                address_permanent: res.data.address_permanent || '',
                pan_number: res.data.pan_number || '',
                aadhar_number: res.data.aadhar_number || '',
                uan: res.data.uan || ''
            });
        } catch (err) {
            console.error(err);
            setError('Failed to load user profile.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [token]);

    const handleSave = async () => {
        try {
            setSaveStatus('Saving changes...');
            await api.put('/users/me', editForm);
            await fetchUserData(); // Ensure data matches backend perfectly
            setIsEditing(false);
            setSaveStatus('Profile synchronized successfully');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (err) {
            console.error(err);
            setSaveStatus('Failed to update system records');
        }
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            setAvatarUploadStatus('Uploading...');
            await api.post('/uploads/user-avatar', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data'
                }
            });
            setAvatarUploadStatus('');
            fetchUserData(); // refresh avatar
        } catch (err) {
            console.error(err);
            setAvatarUploadStatus('Upload failed');
            setTimeout(() => setAvatarUploadStatus(''), 3000);
        }
    };

    if (loading) return <PremiumLoader message="Fetching Full HRMS Identity..." />;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    const handleEditChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="mx-auto w-full">
            {saveStatus && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center shadow-sm ${saveStatus.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-[var(--theme-secondary)] text-[var(--theme-primary)] border border-[var(--theme-primary)]/20'}`}>
                    <FiCheckCircle className="mr-2" size={18}/> {saveStatus}
                </div>
            )}

            {avatarUploadStatus && (
                <div className="mb-6 p-4 rounded-xl text-sm font-semibold flex items-center shadow-sm bg-yellow-50 text-yellow-700 border border-yellow-200">
                    {avatarUploadStatus}
                </div>
            )}

            <div className="bg-white rounded-[24px] shadow-[0_4px_34px_rgb(0,0,0,0.03)] border border-gray-100 overflow-hidden relative">
                
                {/* Enterprise Header Area */}
                <div className="h-40 relative overflow-hidden" style={{ background: 'var(--theme-primary)' }}>
                    <button 
                        onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                        className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center transition-all shadow-md z-20"
                    >
                        {isEditing ? <><FiX className="mr-2" size={16}/> Discard Changes</> : <><FiEdit2 className="mr-2" size={16}/> Edit Full Profile</>}
                    </button>
                    
                    {/* Background decorations */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dimension.png')] bg-repeat"></div>
                    <div className="absolute right-0 bottom-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
                </div>
                
                {/* Main Profile Body */}
                <div className="px-8 pb-10">
                    <div className="flex flex-col lg:flex-row gap-10 relative z-10 w-full">
                        
                        {/* Avatar Column */}
                        <div className="lg:w-1/4 -mt-20 flex flex-col items-center">
                            <div className="relative group">
                                <div className="w-40 h-40 rounded-[32px] bg-white p-2 shadow-xl mb-6 cursor-pointer transform group-hover:scale-105 transition-all duration-300">
                                    <div 
                                        className="w-full h-full bg-gray-50 rounded-[24px] flex items-center justify-center text-[54px] text-[var(--theme-primary)] font-bold tracking-tighter border border-gray-100 overflow-hidden relative"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {userData?.avatar_original_url ? (
                                            <img src={userData.avatar_original_url} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <>{userData?.first_name?.[0]}{userData?.last_name?.[0]}</>
                                        )}
                                        
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white flex-col">
                                            <FiCamera size={28} className="mb-2"/>
                                            <span className="text-[11px] uppercase font-bold tracking-widest">Update Photo</span>
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleAvatarUpload} 
                                />
                            </div>
                            
                            {!isEditing && (
                                <div className="w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                                    <div className="w-full bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[12px] font-extrabold flex items-center justify-center">
                                        <FiCheckCircle className="mr-2" size={16}/> Active Employee
                                    </div>
                                    <div className="w-full pt-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">System Roles</p>
                                        <div className="flex flex-col gap-2">
                                            {userData?.roles?.map((role, idx) => (
                                                <div key={idx} className="bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-[13px] font-bold capitalize flex items-center group relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--theme-primary)]"></div>
                                                    <span className="ml-2">{role}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Data Grids Column */}
                        <div className="lg:w-3/4 pt-6 lg:pt-2 w-full">
                            {/* Summary Header */}
                            {!isEditing && (
                                <div className="mb-10 pb-6 border-b border-gray-100">
                                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none mb-3">
                                        {userData?.first_name} {userData?.last_name}
                                    </h1>
                                    <p className="text-[18px] font-semibold text-[var(--theme-primary)] flex items-center mt-3">
                                        {userData?.job_title || 'Title Unassigned'} <span className="mx-3 text-gray-200">|</span> {userData?.department || 'Dept Unassigned'}
                                    </p>
                                </div>
                            )}

                            {isEditing ? (
                                <div className="space-y-8">
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-inner">
                                        <h3 className="text-[16px] font-extrabold text-gray-800 mb-6 flex items-center border-b border-gray-200 pb-3 uppercase tracking-wider"><FiEdit2 className="mr-2 text-[var(--theme-primary)]"/> Basic & Work Identity</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                            <InputField label="Legal First Name" value={editForm.first_name} onChange={(e) => handleEditChange('first_name', e.target.value)} />
                                            <InputField label="Legal Last Name" value={editForm.last_name} onChange={(e) => handleEditChange('last_name', e.target.value)} />
                                            <InputField label="Job Title" value={editForm.job_title} onChange={(e) => handleEditChange('job_title', e.target.value)} />
                                            <InputField label="Department" value={editForm.department} onChange={(e) => handleEditChange('department', e.target.value)} />
                                            <InputField label="Base Work Location" value={editForm.location} onChange={(e) => handleEditChange('location', e.target.value)} />
                                            <InputField label="Work Phone Number" value={editForm.phone_number} onChange={(e) => handleEditChange('phone_number', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 shadow-inner">
                                        <h3 className="text-[16px] font-extrabold text-gray-800 mb-6 flex items-center border-b border-gray-200 pb-3 uppercase tracking-wider"><FiShield className="mr-2 text-[var(--theme-primary)]"/> Statutory & Personal Data</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                            <InputField label="Date of Birth" value={editForm.dob} type="date" onChange={(e) => handleEditChange('dob', e.target.value)} />
                                            <InputField label="PAN Number" value={editForm.pan_number} onChange={(e) => handleEditChange('pan_number', e.target.value)} />
                                            <InputField label="Aadhar Number" value={editForm.aadhar_number} onChange={(e) => handleEditChange('aadhar_number', e.target.value)} />
                                            <InputField label="UAN (PF Number)" value={editForm.uan} onChange={(e) => handleEditChange('uan', e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-1 gap-x-6 gap-y-2 mt-2">
                                            <InputField label="Temporary Address" value={editForm.address_temporary} onChange={(e) => handleEditChange('address_temporary', e.target.value)} />
                                            <InputField label="Permanent Address" value={editForm.address_permanent} onChange={(e) => handleEditChange('address_permanent', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end sticky bottom-4 z-50">
                                        <button 
                                            onClick={handleSave}
                                            className="px-10 py-4 rounded-xl text-white font-extrabold transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center text-[15px]"
                                            style={{ backgroundColor: 'var(--theme-primary)' }}
                                        >
                                            <FiSave className="mr-3" size={20}/> Synchronize All Changes to Registry
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DisplayField icon={FiMail} label="Corporate Email" value={userData?.email} />
                                        <DisplayField icon={FiPhone} label="Direct Line" value={userData?.phone_number} />
                                        <DisplayField icon={FiBriefcase} label="Office Location" value={userData?.location} />
                                        <DisplayField icon={FiCalendar} label="Date of Birth" value={userData?.dob} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <DisplayField icon={FiFileText} label="PAN Card" value={userData?.pan_number} />
                                        <DisplayField icon={FiFileText} label="Aadhar Card" value={userData?.aadhar_number} />
                                        <DisplayField icon={FiFileText} label="UAN / PF No." value={userData?.uan} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <DisplayField icon={FiHome} label="Current / Temp Address" value={userData?.address_temporary} />
                                        <DisplayField icon={FiHome} label="Permanent Address" value={userData?.address_permanent} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserProfile;
