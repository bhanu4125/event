import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  ArrowLeft,
  Plus,
  X,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const CreateTeamPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('eventId') || '';

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventId: initialEventId,
    requiredSkills: ['React', 'Python'],
    openRoles: ['Frontend Developer', 'ML Specialist'],
    isPublicRecruiting: true,
  });

  const [skillInput, setSkillInput] = useState('');
  const [roleInput, setRoleInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchTeamEvents = async () => {
      try {
        setLoadingEvents(true);
        const res = await apiClient.get('/events/public?eventType=Team');
        setEvents(res.data.data || []);
        if (!formData.eventId && res.data.data?.length > 0) {
          setFormData((prev) => ({ ...prev, eventId: res.data.data[0]._id }));
        }
      } catch (err) {
        console.error('Error fetching team events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchTeamEvents();
  }, []);

  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !formData.requiredSkills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const addRole = (e) => {
    e.preventDefault();
    if (roleInput.trim() && !formData.openRoles.includes(roleInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        openRoles: [...prev.openRoles, roleInput.trim()],
      }));
      setRoleInput('');
    }
  };

  const removeRole = (role) => {
    setFormData((prev) => ({
      ...prev,
      openRoles: prev.openRoles.filter((r) => r !== role),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter a team name');
      return;
    }
    if (!formData.eventId) {
      setErrorMsg('Please select an event for your team');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await apiClient.post('/teams', formData);
      const teamId = res.data.data._id;
      navigate(`/teams/${teamId}`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            to="/teams"
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create a New Team
            </h1>
            <p className="text-xs text-slate-500">
              Form a squad to compete in campus hackathons and team competitions.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="clean-card p-6 sm:p-8 space-y-6">
          {/* Target Event Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Target Competition / Event <span className="text-rose-500">*</span>
            </label>
            {loadingEvents ? (
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            ) : (
              <select
                value={formData.eventId}
                onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {events.map((evt) => (
                  <option key={evt._id} value={evt._id}>
                    {evt.title} ({evt.category} • Team: {evt.minTeamSize}-{evt.maxTeamSize} members)
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-slate-500">
              Only published events configured for team-based participation are eligible.
            </p>
          </div>

          {/* Team Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Team Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Neural Hackers, ByteMasters, SkyNet AI"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Team Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Team Goal & Short Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What project or track are you building? What kind of teammates are you looking for?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Required Skills Tag Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Required Technical & Design Skills
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add skill (e.g. React, PyTorch, Figma)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-indigo-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Open Roles Tag Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Open Positions & Roles to Fill
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                placeholder="Add open position (e.g. Frontend Engineer, UI Designer)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={addRole}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Add Role
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.openRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium"
                >
                  <span>{role}</span>
                  <button
                    type="button"
                    onClick={() => removeRole(role)}
                    className="hover:text-slate-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Public Recruitment Toggle */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 block">
                Enable Public Recruitment
              </span>
              <p className="text-[11px] text-slate-500">
                Allow campus students to discover this team in the Team Finder and send join requests.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublicRecruiting}
                onChange={(e) =>
                  setFormData({ ...formData, isPublicRecruiting: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/teams"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
            >
              {submitting ? 'Creating Team...' : 'Create Team & Open Management'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateTeamPage;
