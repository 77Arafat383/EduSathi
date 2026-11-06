import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Save,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Check,
  Clock,
  Layers,
  Sliders,
  Share2,
  ExternalLink,
  Facebook,
  Linkedin,
  Youtube,
  Twitter,
  Github,
  Instagram,
  Navigation,
  Compass,
  Radio,
  ChevronDown
} from 'lucide-react';

const SETTING_MODULES = [
  {
    id: 'location',
    name: 'Campus & Location Profile',
    desc: 'Physical address, GPS coordinates, maps pin & campus branches',
    icon: MapPin,
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    id: 'social',
    name: 'Social Media Accounts',
    desc: 'Facebook, LinkedIn, YouTube, X/Twitter, Instagram & WhatsApp',
    icon: Share2,
    iconColor: 'text-brand-600',
    bgColor: 'bg-brand-50',
  },
  {
    id: 'academic',
    name: 'Academic Policy & Grading',
    desc: 'Term dates, attendance rules, passing grades & credit limits',
    icon: GraduationCap,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
] as const;

interface InstitutionalSettings {
  // 1. Campus & Location Identity
  institutionName: string;
  tagline: string;
  institutionCode: string;
  locationName: string;
  campusType: string;
  streetAddress: string;
  city: string;
  division: string;
  postalCode: string;
  country: string;
  googleMapsUrl: string;
  latitude: string;
  longitude: string;
  campusPhone: string;
  emergencyHelpline: string;
  adminEmail: string;
  officialWebsite: string;
  timeZone: string;
  defaultLanguage: string;
  portalLogoUrl: string;

  // 2. Social Media & Online Presences
  facebookUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  githubUrl: string;
  whatsappNumber: string;
  telegramChannel: string;

  // 3. Academic Policy & Examination Rules
  academicYear: string;
  activeTerm: string;
  termStartDate: string;
  termEndDate: string;
  minAttendancePercent: number;
  passingGradePercent: number;
  honorsBenchmarkPercent: number;
  maxCourseCreditsPerTerm: number;
  courseDropGraceDays: number;
  gradingScale: string;
  autoProbationAlert: boolean;
}

const DEFAULT_SETTINGS: InstitutionalSettings = {
  // 1. Campus & Location Identity
  institutionName: 'EduSathi Institute of Science & Technology',
  tagline: 'Empowering Higher Education with Next-Generation Learning Systems',
  institutionCode: 'EDUS-BD-2026-9041',
  locationName: 'Main Academic Campus - Uttara',
  campusType: 'Permanent Academic Campus',
  streetAddress: 'Plot #14, Sector 7, Uttara Model Town',
  city: 'Dhaka',
  division: 'Dhaka Division',
  postalCode: '1230',
  country: 'Bangladesh',
  googleMapsUrl: 'https://maps.google.com/?q=23.8759,90.3795',
  latitude: '23.8759° N',
  longitude: '90.3795° E',
  campusPhone: '+880 2-8901234',
  emergencyHelpline: '+880 1700-000000',
  adminEmail: 'registrar@edusathi.edu.bd',
  officialWebsite: 'https://edusathi.edu.bd',
  timeZone: 'Asia/Dhaka (GMT+6)',
  defaultLanguage: 'English (Institutional)',
  portalLogoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150',

  // 2. Social Media & Online Presences
  facebookUrl: 'https://facebook.com/edusathi.bangladesh',
  linkedinUrl: 'https://linkedin.com/school/edusathi-institute',
  youtubeUrl: 'https://youtube.com/@edusathi-official',
  twitterUrl: 'https://x.com/edusathi_edu',
  instagramUrl: 'https://instagram.com/edusathi_campus',
  githubUrl: 'https://github.com/77Arafat383/EduSathi',
  whatsappNumber: '+880 1711-223344',
  telegramChannel: 'https://t.me/edusathi_notices',

  // 3. Academic Policy & Examination Rules
  academicYear: '2026 - 2027',
  activeTerm: 'Fall Semester 2026',
  termStartDate: '2026-07-01',
  termEndDate: '2026-12-31',
  minAttendancePercent: 75,
  passingGradePercent: 40,
  honorsBenchmarkPercent: 80,
  maxCourseCreditsPerTerm: 21,
  courseDropGraceDays: 14,
  gradingScale: '4.00 Standard UGC Uniform Grading System',
  autoProbationAlert: true,
};

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<InstitutionalSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'location' | 'social' | 'academic'>('location');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dropdown state and click outside handler
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModuleIndex = SETTING_MODULES.findIndex(m => m.id === activeTab);
  const currentModule = SETTING_MODULES[currentModuleIndex >= 0 ? currentModuleIndex : 0];
  const CurrentIcon = currentModule.icon;

  // Load persisted settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('edusathi_institutional_settings');
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {
      console.warn('Could not load custom settings, using defaults', e);
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem('edusathi_institutional_settings', JSON.stringify(settings));
        setSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } catch (e) {
        console.error('Failed to save settings:', e);
        setSaving(false);
      }
    }, 400);
  };

  const updateSetting = <K extends keyof InstitutionalSettings>(key: K, value: InstitutionalSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 pb-24 text-slate-900">
      {/* Institutional Top Command Bar */}
      <div className="border border-slate-300 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Institutional Platform Settings &amp; Governance
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Manage university identity, campus location profiles, official social media integrations &amp; academic rules.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Synchronizing...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Institutional configuration successfully saved and synchronized across administrative modules.</span>
            </div>
            <span className="font-bold">STATUS: APPLIED</span>
          </div>
        )}
      </div>

      {/* Module Navigation Dropdown Menu */}
      <div className="border border-slate-300 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="relative w-full sm:max-w-md" ref={dropdownRef}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-1 flex items-center justify-between">
            <span>Settings Configuration Module</span>
            <span className="sm:hidden font-mono text-slate-400">
              {currentModuleIndex + 1} of {SETTING_MODULES.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 transition text-left focus:outline-none focus:border-slate-900"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 flex items-center justify-center border border-slate-200 ${currentModule.bgColor} shrink-0`}>
                <CurrentIcon className={`w-4 h-4 ${currentModule.iconColor}`} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="truncate">{currentModule.name}</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono bg-slate-200 text-slate-700 font-semibold uppercase shrink-0">Active</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate hidden sm:block">
                  {currentModule.desc}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} shrink-0`} />
          </button>

          {/* Dropdown Menu List */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-300 shadow-xl z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Select Configuration Section (3 Modules)
              </div>
              {SETTING_MODULES.map((mod, idx) => {
                const Icon = mod.icon;
                const isSelected = activeTab === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(mod.id as any);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition ${isSelected ? 'bg-slate-100 text-slate-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 flex items-center justify-center border border-slate-200 ${mod.bgColor} shrink-0`}>
                        <Icon className={`w-4 h-4 ${mod.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{idx + 1}. {mod.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {mod.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">Switch</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>


      </div>

      {/* TAB 1: CAMPUS & LOCATION IDENTITY */}
      {activeTab === 'location' && (
        <div className="space-y-4">
          <div className="border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
                  Campus Location &amp; Institutional Geographic Identity
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Official physical campus address, location designations, Google Maps coordination, and emergency response contacts.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 text-[10px] font-mono font-bold">
                {settings.locationName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Official Institution Name
                </label>
                <input
                  type="text"
                  value={settings.institutionName}
                  onChange={(e) => updateSetting('institutionName', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Institutional Code (Govt / UGC Accreditation)
                </label>
                <input
                  type="text"
                  value={settings.institutionCode}
                  onChange={(e) => updateSetting('institutionCode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Institutional Motto / Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => updateSetting('tagline', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Campus / Branch Location Name
                </label>
                <input
                  type="text"
                  value={settings.locationName}
                  onChange={(e) => updateSetting('locationName', e.target.value)}
                  placeholder="e.g. Main Academic Campus - Uttara"
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Campus Classification
                </label>
                <select
                  value={settings.campusType}
                  onChange={(e) => updateSetting('campusType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                >
                  <option value="Permanent Academic Campus">Permanent Academic Campus</option>
                  <option value="City Campus / Annex">City Campus / Annex</option>
                  <option value="Research & Technology Hub">Research &amp; Technology Hub</option>
                  <option value="Administrative Secretariat">Administrative Secretariat</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={settings.country}
                  onChange={(e) => updateSetting('country', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white font-medium"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Detailed Street Address
                </label>
                <input
                  type="text"
                  value={settings.streetAddress}
                  onChange={(e) => updateSetting('streetAddress', e.target.value)}
                  placeholder="Plot, Road, Sector or Holding"
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  City / Metropolitan Area
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => updateSetting('city', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Administrative Division / District
                </label>
                <input
                  type="text"
                  value={settings.division}
                  onChange={(e) => updateSetting('division', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  value={settings.postalCode}
                  onChange={(e) => updateSetting('postalCode', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Official University Portal URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={settings.officialWebsite}
                    onChange={(e) => updateSetting('officialWebsite', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.officialWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-2 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    title="Open website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Google Maps Pin URL / Embed Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={settings.googleMapsUrl}
                    onChange={(e) => updateSetting('googleMapsUrl', e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="flex-1 px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-2 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-600"
                    title="View pin on Google Maps"
                  >
                    <Compass className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  GPS Coordinates (Lat / Long)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={settings.latitude}
                    onChange={(e) => updateSetting('latitude', e.target.value)}
                    placeholder="Latitude"
                    className="px-2.5 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <input
                    type="text"
                    value={settings.longitude}
                    onChange={(e) => updateSetting('longitude', e.target.value)}
                    placeholder="Longitude"
                    className="px-2.5 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Campus Switchboard Phone
                </label>
                <input
                  type="text"
                  value={settings.campusPhone}
                  onChange={(e) => updateSetting('campusPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  24/7 Campus Emergency Hotline
                </label>
                <input
                  type="text"
                  value={settings.emergencyHelpline}
                  onChange={(e) => updateSetting('emergencyHelpline', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white font-bold text-rose-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Registrar Office Email
                </label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => updateSetting('adminEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL MEDIA & PUBLIC CHANNELS */}
      {activeTab === 'social' && (
        <div className="space-y-4">
          <div className="border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800">
                  Official Institutional Social Media Accounts &amp; Broadcast Channels
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure public handles rendered on student portals, course syllabi, public landing footers, and official correspondence.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                8 Integrated Channels
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Facebook */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Facebook className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Facebook Official Page &amp; Student Group</span>
                    <p className="text-[10px] text-slate-500">University notices and student community broadcasts</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.facebookUrl}
                    onChange={(e) => updateSetting('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* LinkedIn */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-sky-700 text-white flex items-center justify-center font-bold">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">LinkedIn Institutional Profile</span>
                    <p className="text-[10px] text-slate-500">Alumni career networks, faculty research, and corporate partnerships</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.linkedinUrl}
                    onChange={(e) => updateSetting('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/school/..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* YouTube */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-red-600 text-white flex items-center justify-center font-bold">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">YouTube Academic Lecture Channel</span>
                    <p className="text-[10px] text-slate-500">Recorded course lectures, seminars, and convocations</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.youtubeUrl}
                    onChange={(e) => updateSetting('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/@..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* X / Twitter */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center font-bold">
                    <Twitter className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">X / Twitter Official Handle</span>
                    <p className="text-[10px] text-slate-500">Real-time alerts, campus emergency notices, and press releases</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.twitterUrl}
                    onChange={(e) => updateSetting('twitterUrl', e.target.value)}
                    placeholder="https://x.com/..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.twitterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Instagram */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-pink-600 text-white flex items-center justify-center font-bold">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Instagram Campus Life</span>
                    <p className="text-[10px] text-slate-500">Student club activities, sports, cultural exhibitions, and campus galleries</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.instagramUrl}
                    onChange={(e) => updateSetting('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* GitHub */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-slate-800 text-white flex items-center justify-center font-bold">
                    <Github className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">GitHub Organization / Tech Projects</span>
                    <p className="text-[10px] text-slate-500">Student code repositories, open curriculum, and university software labs</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.githubUrl}
                    onChange={(e) => updateSetting('githubUrl', e.target.value)}
                    placeholder="https://github.com/..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* WhatsApp Business */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">WhatsApp Student Admissions &amp; Helpdesk</span>
                    <p className="text-[10px] text-slate-500">Direct admission enquiries and student support messaging</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) => updateSetting('whatsappNumber', e.target.value)}
                    placeholder="+880 1700-000000"
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Open WhatsApp Chat"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Telegram Channel */}
              <div className="p-4 border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 bg-sky-500 text-white flex items-center justify-center font-bold">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">Telegram Instant Notice Broadcast</span>
                    <p className="text-[10px] text-slate-500">Official instantaneous semester routine and emergency exam updates</p>
                  </div>
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={settings.telegramChannel}
                    onChange={(e) => updateSetting('telegramChannel', e.target.value)}
                    placeholder="https://t.me/..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <a
                    href={settings.telegramChannel}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-300 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC POLICIES & GRADING RULES */}
      {activeTab === 'academic' && (
        <div className="space-y-4">
          <div className="border border-slate-300 bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800 mb-1">
              Curricular Governance, Grading Standards &amp; Examination Cutoffs
            </h3>
            <p className="text-[11px] text-slate-500 mb-6">
              Establish institutional policy benchmarks for student examination eligibility, grade cutoffs, credit caps, and probation flags.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Current Academic Year
                </label>
                <input
                  type="text"
                  value={settings.academicYear}
                  onChange={(e) => updateSetting('academicYear', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Active Regular Term
                </label>
                <input
                  type="text"
                  value={settings.activeTerm}
                  onChange={(e) => updateSetting('activeTerm', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Institutional Grading System
                </label>
                <select
                  value={settings.gradingScale}
                  onChange={(e) => updateSetting('gradingScale', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 bg-white"
                >
                  <option value="4.00 Standard UGC Uniform Grading System">4.00 Standard UGC Uniform Grading System</option>
                  <option value="Percentage Based Marking (0 - 100%)">Percentage Based Marking (0 - 100%)</option>
                  <option value="Letter Grade Scale (A+, A, B, C, F)">Letter Grade Scale (A+, A, B, C, F)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Term Start Date
                </label>
                <input
                  type="date"
                  value={settings.termStartDate}
                  onChange={(e) => updateSetting('termStartDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Term End Date
                </label>
                <input
                  type="date"
                  value={settings.termEndDate}
                  onChange={(e) => updateSetting('termEndDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Course Drop / Add Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={settings.courseDropGraceDays}
                  onChange={(e) => updateSetting('courseDropGraceDays', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Minimum Attendance for Final Exam Eligibility (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={settings.minAttendancePercent}
                    onChange={(e) => updateSetting('minAttendancePercent', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Students below this threshold are flagged with attendance warnings.</p>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Minimum Passing Grade Mark (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="30"
                    max="60"
                    value={settings.passingGradePercent}
                    onChange={(e) => updateSetting('passingGradePercent', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Assignments or quizzes scored below this threshold require re-evaluation.</p>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-600 font-bold mb-1.5">
                  Honors / Dean's List Distinction Benchmark (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="70"
                    max="95"
                    value={settings.honorsBenchmarkPercent}
                    onChange={(e) => updateSetting('honorsBenchmarkPercent', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 focus:outline-none focus:border-slate-900 text-slate-900 font-mono bg-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="lg:col-span-3 pt-3 border-t border-slate-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoProbationAlert}
                    onChange={(e) => updateSetting('autoProbationAlert', e.target.checked)}
                    className="w-4 h-4 text-slate-900 border-slate-300 rounded-none focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900">Automated Academic Probation Flagging</span>
                    <p className="text-[11px] text-slate-500">
                      Automatically tag students in the Academic Standing Roster when attendance falls below {settings.minAttendancePercent}% or pending multiple assessment failures.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
