'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Copy, Save, X } from 'lucide-react'

interface MessageTemplate {
  id: string
  name: string
  subject: string | null
  body: string
  category: string | null
  use_count: number
}

const CATEGORIES = ['reminder', 'weather', 'instructions', 'cancellation', 'general']

export function TemplatesClient() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'general',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/message-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.body) {
      setError('Name and body are required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const url = editingTemplate
        ? `/api/message-templates/${editingTemplate.id}`
        : '/api/message-templates'
      const method = editingTemplate ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      await fetchTemplates()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return

    try {
      const response = await fetch(`/api/message-templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTemplates()
      }
    } catch (err) {
      console.error('Error deleting template:', err)
    }
  }

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      subject: template.subject || '',
      body: template.body,
      category: template.category || 'general',
    })
    setShowEditor(true)
  }

  const handleClose = () => {
    setShowEditor(false)
    setEditingTemplate(null)
    setFormData({ name: '', subject: '', body: '', category: 'general' })
    setError(null)
  }

  const handleCopyTemplate = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.body)
  }

  if (isLoading) {
    return <div className="text-slate-400">Loading templates...</div>
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <button
        onClick={() => setShowEditor(true)}
        className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
      >
        <Plus className="h-4 w-4" />
        New Template
      </button>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-400">No templates yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Create your first message template to save time
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-700">{template.name}</h3>
                  {template.category && (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
                      {template.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyTemplate(template)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-cyan-600"
                    title="Copy template"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(template)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    title="Edit template"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {template.subject && (
                <div className="mb-2 text-sm text-slate-400">
                  <strong>Subject:</strong> {template.subject}
                </div>
              )}

              <div className="rounded bg-white p-3 text-sm text-slate-600">
                {template.body.length > 150
                  ? `${template.body.substring(0, 150)}...`
                  : template.body}
              </div>

              <div className="mt-2 text-xs text-slate-500">
                Used {template.use_count} times
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button
                onClick={handleClose}
                className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Trip Reminder"
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Subject (optional)
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Your trip is tomorrow!"
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Message Body
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Use placeholders: {guest_name}, {date}, {time}, {vessel}, {meeting_spot}"
                  rows={8}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Available placeholders: {'{guest_name}'}, {'{date}'}, {'{time}'},{' '}
                  {'{vessel}'}, {'{meeting_spot}'}
                </p>
              </div>

              {error && (
                <div className="rounded border border-rose-500/50 bg-rose-50 p-3 text-sm text-rose-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
