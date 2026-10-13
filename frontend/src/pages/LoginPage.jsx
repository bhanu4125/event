import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Building,
  KeyRound,
} from 'lucide-react';

const PORTALS = {
  student: {
    id: 'student',
    title: 'Student Portal',
    subtitle: 'Discover campus events, bookmark workshops, and recruit teammates',
    badge: 'Student Access',
    color: 'indigo',
    bgLight: 'bg-indigo-50/70',
    borderLight: 'border-indigo-200',
    iconBg: 'bg-indigo-600',
    textAccent: 'text-indigo-600',
    ringFocus: 'focus:ring-indigo-500',
    btnBg: 'bg-indigo-600 hover:bg-indigo-700',
    demoEmail: 'student@eventra.edu',
    demoPass: 'password123',
    demoLabel: 'Elena Rostova (CS 3rd Year)',
    defaultRedirect: '/',
    allowRegister: true,
  },
  organizer: {
    id: 'organizer',
    title: 'Organizer Studio',
    subtitle: 'Publish college fests, review attendee rosters, and coordinate teams',
    badge: 'Organizer Portal',
    color: 'emerald',
    bgLight: 'bg-emerald-50/70',
    borderLight: 'border-emerald-200',
    iconBg: 'bg-emerald-600',
    textAccent: 'text-emerald-600',
    ringFocus: 'focus:ring-emerald-500',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700',
    demoEmail: 'organizer@eventra.edu',
    demoPass: 'password123',
    demoLabel: 'Devin Vance (Lead Organizer)',
    defaultRedirect: '/organizer',
    allowRegister: true,
  },
  admin: {
    id: 'admin',
    title: 'Campus Admin Desk',
    subtitle: 'Institutional governance, event audit trails, and dean approvals',
    badge: 'Institutional Governance',
    color: 'purple',
    bgLight: 'bg-purple-50/70',
    borderLight: 'border-purple-200',
    iconBg: 'bg-purple-600',
    textAccent: 'text-purple-600',
    ringFocus: 'focus:ring-purple-500',
    btnBg: 'bg-purple-600 hover:bg-purple-700',
    demoEmail: 'admin@eventra.edu',
    demoPass: 'password123',
    demoLabel: 'Dr. Sarah Jenkins (Dean of Affairs)',
    defaultRedirect: '/admin/approvals',
    allowRegister: false,
  },
};

const LoginPage = () => {
  const { portalRole: routePortal } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, isAuthenticated, user } = useAuth();

  // Determine active portal from URL query or path parameter
  const searchParams = new URLSearchParams(location.search);
  const initialPortal =
    routePortal || searchParams.get('portal') || 'student';

  const [activePortal, setActivePortal] = useState(
    PORTALS[initialPortal] ? initialPortal : 'student'
  );

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science');
  const [regYear, setRegYear] = useState('3rd Year');

  useEffect(() => {
    if (routePortal && PORTALS[routePortal]) {
      setActivePortal(routePortal);
    } else if (searchParams.get('portal') && PORTALS[searchParams.get('portal')]) {
      setActivePortal(searchParams.get('portal'));
    }
  }, [routePortal, location.search]);

  // If already authenticated and matches active portal, allow quick jump
  useEffect(() => {
    setErrorMessage('');
    setErrorCode('');
  }, [activePortal, mode]);

  const currentConfig = PORTALS[activePortal];

  const handlePortalSwitch = (portalId) => {
    setActivePortal(portalId);
    setErrorMessage('');
    setErrorCode('');
    setMode('login');
  };

  const handleFillDemo = (pId = activePortal) => {
    const config = PORTALS[pId];
    setEmail(config.demoEmail);
    setPassword(config.demoPass);
    setErrorMessage('');
    setErrorCode('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode('');
    setLoading(true);

    try {
      // Pass portalRole to backend to enforce credential verification
      const loggedUser = await login(email, password, activePortal);

      // Successfully authenticated
      const redirectPath =
        location.state?.from?.pathname || currentConfig.defaultRedirect;
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      if (err.response?.data?.code) {
        setErrorCode(err.response.data.code);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setErrorCode('');
    setLoading(true);

    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: activePortal === 'organizer' ? 'organizer' : 'student',
        department: regDepartment,
        year: regYear,
      });

      const redirectPath = currentConfig.defaultRedirect;
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F8FAFC]">
      <div className="max-w-xl w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Campus Unified Security & Single Sign-On</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to EVENTRA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Choose your dedicated role portal to authenticate and verify access permissions.
          </p>
        </div>

        {/* 3 Separate Login Portals Selector */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/80 rounded-2xl mb-6">
          {/* Student Portal Tab */}
          <button
            type="button"
            onClick={() => handlePortalSwitch('student')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activePortal === 'student'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <GraduationCap className="w-4 h-4 shrink-0 text-indigo-600" />
            <span>Student Portal</span>
          </button>

          {/* Organizer Studio Tab */}
          <button
            type="button"
            onClick={() => handlePortalSwitch('organizer')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activePortal === 'organizer'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Organizer Studio</span>
          </button>

          {/* Admin Governance Tab */}
          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
              activePortal === 'admin'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-purple-600" />
            <span>Campus Admin</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Portal Header Banner */}
          <div className={`${currentConfig.bgLight} border-b ${currentConfig.borderLight} p-5 sm:p-6 transition-all duration-200`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full bg-white/80 border ${currentConfig.borderLight} text-[10px] font-extrabold uppercase tracking-wider ${currentConfig.textAccent}`}>
                  {currentConfig.badge}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {currentConfig.title}
                </h2>
                <p className="text-xs text-slate-600 leading-snug">
                  {currentConfig.subtitle}
                </p>
              </div>

              <div className={`w-12 h-12 rounded-xl ${currentConfig.iconBg} text-white flex items-center justify-center shrink-0 shadow-md`}>
                {activePortal === 'student' && <GraduationCap className="w-6 h-6" />}
                {activePortal === 'organizer' && <Layers className="w-6 h-6" />}
                {activePortal === 'admin' && <ShieldAlert className="w-6 h-6" />}
              </div>
            </div>

            {/* Quick Demo Credentials Autofill Banner */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Demo: <strong>{currentConfig.demoEmail}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => handleFillDemo(activePortal)}
                className={`font-semibold hover:underline cursor-pointer shrink-0 ml-2 ${currentConfig.textAccent}`}
              >
                1-Click Autofill
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8">
            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-rose-800">
                    {errorCode === 'UNAUTHORIZED_ACCESS' ? 'Unauthorized Access Rejected' : 'Authentication Error'}
                  </p>
                  <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
                  {errorCode === 'UNAUTHORIZED_ACCESS' && (
                    <p className="text-rose-600 pt-1 font-medium">
                      Tip: Please switch to your registered role tab above to sign in.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Mode switch for student / organizer */}
            {currentConfig.allowRegister && (
              <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`pb-2 border-b-2 transition ${
                    mode === 'login'
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Sign In with Credentials
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`pb-2 border-b-2 transition ${
                    mode === 'register'
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Create New {activePortal === 'organizer' ? 'Organizer' : 'Student'} Account
                </button>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Campus Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={currentConfig.demoEmail}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <span className="text-[11px] text-slate-400">Min 6 characters</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 ${currentConfig.btnBg}`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Authenticate & Sign In to {currentConfig.title}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Register Form for Student / Organizer */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    College Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@college.edu"
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Department
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Tech</option>
                      <option value="Artificial Intelligence">AI & Data Science</option>
                      <option value="Electronics & Communication">ECE</option>
                      <option value="Mechanical Engineering">Mechanical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Academic Year
                    </label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="Final Year">Final Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 ${currentConfig.btnBg}`}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Complete Registration as {activePortal === 'organizer' ? 'Organizer' : 'Student'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card Footer with Role Explanation */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              Role-Based Access Control Active
            </span>
            <Link to="/" className="text-slate-600 hover:text-indigo-600 font-semibold transition">
              ← Explore Public Events as Guest
            </Link>
          </div>
        </div>

        {/* Demo Credentials Quick Switcher Footer */}
        <div className="mt-6 bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
          <p className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pre-Configured Demo Accounts (Password: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">password123</code>):</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                handlePortalSwitch('student');
                handleFillDemo('student');
              }}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition cursor-pointer"
            >
              <div className="font-bold text-slate-900 text-[11px]">🎓 Student Demo</div>
              <div className="text-[10px] text-slate-500 truncate">student@eventra.edu</div>
            </button>

            <button
              type="button"
              onClick={() => {
                handlePortalSwitch('organizer');
                handleFillDemo('organizer');
              }}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition cursor-pointer"
            >
              <div className="font-bold text-slate-900 text-[11px]">⚡ Organizer Demo</div>
              <div className="text-[10px] text-slate-500 truncate">organizer@eventra.edu</div>
            </button>

            <button
              type="button"
              onClick={() => {
                handlePortalSwitch('admin');
                handleFillDemo('admin');
              }}
              className="text-left p-2 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition cursor-pointer"
            >
              <div className="font-bold text-slate-900 text-[11px]">🛡️ Campus Admin Demo</div>
              <div className="text-[10px] text-slate-500 truncate">admin@eventra.edu</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
