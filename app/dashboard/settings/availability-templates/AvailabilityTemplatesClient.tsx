'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, Star, Calendar, Clock, Loader2 } from 'lucide-react'

interface TimeSlot {
  start: string
  end: string
}

interface Template {
  id: string
  name: string
  is_default: boolean
  weekly_schedule: Record<string, TimeSlot[]>
  created_at: string
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export default function AvailabilityTemplatesClient() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      setLoading(true)
      const res = await fetch('/api/availability-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const res = await fetch(`/api/availability-templates/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        loadTemplates()
      }
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
  }

  async function setDefault(id: string) {
    try {
      const res = await fetch(`/api/availability-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      if (res.ok) {
        loadTemplates()
      }
    } catch (err) {
      console.error('Failed to set default:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Your Templates</h2>
          <p className="text-slate-400 text-sm mt-1">
            Create reusable weekly schedules
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null)
            setShowCreateModal(true)
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No Templates Yet
          </h3>
          <p className="text-slate-400 mb-6">
            Create your first availability template to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-6 bg-white rounded-xl border ${
                template.is_default ? 'border-amber-500/50' : 'border-slate-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <Star className="w-4 h-4 fill-amber-400 text-amber-600" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {Object.keys(template.weekly_schedule || {}).length} days configured
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTemplate(template)
                      setShowCreateModal(true)
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!template.is_default && (
                    <>
                      <button
                        onClick={() => setDefault(template.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-amber-600"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Weekly Preview */}
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const slots = template.weekly_schedule?.[day] || []
                  return (
                    <div key={day} className="flex items-center gap-3 text-sm">
                      <span className="w-12 text-slate-500 font-medium">
                        {DAY_LABELS[day]}
                      </span>
                      {slots.length > 0 ? (
                        <div className="flex-1 flex flex-wrap gap-1">
                          {slots.map((slot, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-cyan-50 text-cyan-600 rounded text-xs"
                            >
                              {slot.start} - {slot.end}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">Unavailable</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <TemplateEditorModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
          }}
          onSave={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
            loadTemplates()
          }}
        />
      )}
    </div>
  )
}

interface TemplateEditorModalProps {
  template: Template | null
  onClose: () => void
  onSave: () => void
}

function TemplateEditorModal({ template, onClose, onSave }: TemplateEditorModalProps) {
  const [name, setName] = useState(template?.name || '')
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, TimeSlot[]>>(
    template?.weekly_schedule || {}
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addTimeSlot(day: string) {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '09:00', end: '17:00' }],
    }))
  }

  function removeTimeSlot(day: string, index: number) {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: (prev[day] || []).filter((_, i) => i !== index),
    }))
  }

  function updateTimeSlot(day: string, index: number, field: 'start' | 'end', value: string) {
    setWeeklySchedule(prev => ({
      ...prev,
      [day]: (prev[day] || []).map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }))
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const url = template
        ? `/api/availability-templates/${template.id}`
        : '/api/availability-templates'

      const res = await fetch(url, {
        method: template ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          weeklySchedule,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save template')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
          <h2 className="text-2xl font-bold text-slate-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Template Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Summer Hours, Weekend Schedule"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            {/* Weekly Schedule */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Schedule</h3>
              <div className="space-y-4">
                {DAYS.map((day) => {
                  const slots = weeklySchedule[day] || []
                  return (
                    <div key={day} className="p-4 bg-white rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-slate-900 capitalize">
                          {day}
                        </span>
                        <button
                          onClick={() => addTimeSlot(day)}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Slot
                        </button>
                      </div>

                      {slots.length === 0 ? (
                        <p className="text-sm text-slate-500">No availability</p>
                      ) : (
                        <div className="space-y-2">
                          {slots.map((slot, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateTimeSlot(day, index, 'start', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                              />
                              <span className="text-slate-500">to</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateTimeSlot(day, index, 'end', e.target.value)}
                                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                              />
                              <button
                                onClick={() => removeTimeSlot(day, index)}
                                className="p-2 hover:bg-white rounded text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-500/20 rounded-lg">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
