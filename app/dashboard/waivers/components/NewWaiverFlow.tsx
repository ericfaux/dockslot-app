'use client';

import { useState } from 'react';
import { FileText, PenLine, ArrowLeft } from 'lucide-react';
import {
  STANDARD_WAIVER_TEMPLATES,
  WAIVER_CATEGORY_CONFIG,
  type StandardWaiverTemplate,
} from '@/lib/data/standard-waiver-templates';
import { WaiverTemplateForm } from './WaiverTemplateForm';

export function NewWaiverFlow() {
  const [selectedTemplate, setSelectedTemplate] = useState<StandardWaiverTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);

  // If a template was selected or "start from scratch" was clicked, show the form
  if (showForm) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setSelectedTemplate(null);
          }}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to template selection
        </button>

        <WaiverTemplateForm
          prefill={
            selectedTemplate
              ? { title: selectedTemplate.title, content: selectedTemplate.content }
              : undefined
          }
        />
      </div>
    );
  }

  // Show template selection UI
  return (
    <div className="space-y-8">
      {/* Start from Template */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Start from a Template</h2>
          <p className="mt-1 text-sm text-slate-400">
            Choose a pre-written waiver template as a starting point. You can customize it before saving.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STANDARD_WAIVER_TEMPLATES.map((template) => {
            const categoryConfig = WAIVER_CATEGORY_CONFIG[template.category];
            return (
              <button
                key={template.key}
                type="button"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowForm(true);
                }}
                className="group rounded-lg border border-slate-200 bg-white p-5 text-left transition-all hover:border-cyan-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryConfig.color}`}
                      >
                        {categoryConfig.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 group-hover:text-cyan-600 transition-colors">
                      {template.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-slate-300 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-4 text-sm text-slate-400">or</span>
        </div>
      </div>

      {/* Start from Scratch */}
      <div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="group w-full rounded-lg border-2 border-dashed border-slate-200 bg-white p-6 text-center transition-all hover:border-cyan-300 hover:bg-cyan-50/30"
        >
          <PenLine className="mx-auto h-8 w-8 text-slate-300 group-hover:text-cyan-400 transition-colors" />
          <h3 className="mt-3 font-medium text-slate-900 group-hover:text-cyan-600 transition-colors">
            Start from Scratch
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Write your own waiver content from a blank template
          </p>
        </button>
      </div>
    </div>
  );
}
