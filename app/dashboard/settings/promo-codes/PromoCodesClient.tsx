'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Power,
  Copy,
  Check,
  Loader2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Hash,
  X,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import {
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCode,
  getPromoCodes,
  getPromoCodeStats,
  type CreatePromoCodeParams,
} from '@/app/actions/promo-codes';
import type { PromoCode, PromoCodeStats, TripType } from '@/lib/db/types';
import { formatCents } from '@/lib/utils/format';

interface PromoCodesClientProps {
  tripTypes?: Pick<TripType, 'id' | 'title'>[];
}

export default function PromoCodesClient({ tripTypes = [] }: PromoCodesClientProps) {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<PromoCodeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState('');
  const [formValidFrom, setFormValidFrom] = useState('');
  const [formValidTo, setFormValidTo] = useState('');
  const [formMaxUses, setFormMaxUses] = useState('');
  const [formTripTypeIds, setFormTripTypeIds] = useState<string[]>([]);
  const [showTripTypeFilter, setShowTripTypeFilter] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [codesResult, statsResult] = await Promise.all([
        getPromoCodes(),
        getPromoCodeStats(),
      ]);

      if (codesResult.success && codesResult.data) {
        setCodes(codesResult.data);
      }
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('Error loading promo code data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setFormCode('');
    setFormDiscountType('percentage');
    setFormDiscountValue('');
    setFormValidFrom('');
    setFormValidTo('');
    setFormMaxUses('');
    setFormTripTypeIds([]);
    setShowTripTypeFilter(false);
    setCreateError(null);
  }

  async function handleCreate() {
    setCreateError(null);
    setIsCreating(true);

    const params: CreatePromoCodeParams = {
      code: formCode,
      discount_type: formDiscountType,
      discount_value: formDiscountType === 'percentage'
        ? parseInt(formDiscountValue, 10)
        : Math.round(parseFloat(formDiscountValue) * 100), // Convert dollars to cents for fixed
      valid_from: formValidFrom || null,
      valid_to: formValidTo || null,
      max_uses: formMaxUses ? parseInt(formMaxUses, 10) : null,
      trip_type_ids: formTripTypeIds,
    };

    if (!params.code.trim()) {
      setCreateError('Promo code is required');
      setIsCreating(false);
      return;
    }

    if (!formDiscountValue || isNaN(params.discount_value) || params.discount_value < 1) {
      setCreateError('Please enter a valid discount value');
      setIsCreating(false);
      return;
    }

    const result = await createPromoCode(params);

    if (result.success) {
      resetForm();
      setShowCreateForm(false);
      await loadData();
    } else {
      setCreateError(result.error || 'Failed to create promo code');
    }
    setIsCreating(false);
  }

  async function handleToggle(id: string) {
    const result = await togglePromoCode(id);
    if (result.success) {
      setCodes(codes.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this promo code? This cannot be undone.')) return;

    const result = await deletePromoCode(id);
    if (result.success) {
      setCodes(codes.filter(c => c.id !== id));
    } else {
      alert(result.error || 'Failed to delete promo code');
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatDiscount(type: string, value: number) {
    if (type === 'percentage') return `${value}% off`;
    return `${formatCents(value)} off`;
  }

  function getCodeStatus(code: PromoCode): { label: string; color: string } {
    if (!code.is_active) return { label: 'Inactive', color: 'bg-slate-100 text-slate-400' };
    const today = new Date().toISOString().split('T')[0];
    if (code.valid_from && today < code.valid_from) return { label: 'Scheduled', color: 'bg-blue-50 text-blue-600' };
    if (code.valid_to && today > code.valid_to) return { label: 'Expired', color: 'bg-amber-50 text-amber-600' };
    if (code.max_uses !== null && code.current_uses >= code.max_uses) return { label: 'Limit Reached', color: 'bg-amber-50 text-amber-600' };
    return { label: 'Active', color: 'bg-emerald-50 text-emerald-600' };
  }

  const inputClassName = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
        <p className="text-slate-400 mt-1">
          Create discount codes to incentivize direct bookings
        </p>
      </div>

      {/* Stats Cards */}
      {stats && stats.total_codes > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Active Codes</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stats.active_codes}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Total Uses</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stats.total_uses}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Discounts Given</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatCents(stats.total_discount_given_cents)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">Revenue from Promos</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatCents(stats.total_revenue_from_promos_cents)}</p>
          </div>
        </div>
      )}

      {/* Create New Code */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
              <Tag className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {showCreateForm ? 'Create New Code' : 'Promo Codes'}
              </h2>
              <p className="text-sm text-slate-400">
                {codes.length} code{codes.length !== 1 ? 's' : ''} created
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (showCreateForm) {
                resetForm();
                setShowCreateForm(false);
              } else {
                setShowCreateForm(true);
              }
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showCreateForm
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            }`}
          >
            {showCreateForm ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                New Code
              </>
            )}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            {createError && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {createError}
              </div>
            )}

            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Promo Code *
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                placeholder="e.g. SPRING2026, MILITARY10"
                maxLength={30}
                className={inputClassName}
              />
              <p className="mt-1 text-xs text-slate-500">
                Letters, numbers, hyphens, and underscores only
              </p>
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Discount Type *
                </label>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('percentage')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      formDiscountType === 'percentage'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Percent className="h-4 w-4" />
                    Percentage
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDiscountType('fixed')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                      formDiscountType === 'fixed'
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Fixed Amount
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Discount Value *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    {formDiscountType === 'percentage' ? '%' : '$'}
                  </span>
                  <input
                    type="number"
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    placeholder={formDiscountType === 'percentage' ? '10' : '50.00'}
                    min={formDiscountType === 'percentage' ? 1 : 0.01}
                    max={formDiscountType === 'percentage' ? 100 : undefined}
                    step={formDiscountType === 'percentage' ? 1 : 0.01}
                    className={`${inputClassName} pl-8`}
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Valid From
                    <span className="text-slate-500 font-normal">(optional)</span>
                  </span>
                </label>
                <input
                  type="date"
                  value={formValidFrom}
                  onChange={(e) => setFormValidFrom(e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Valid To
                    <span className="text-slate-500 font-normal">(optional)</span>
                  </span>
                </label>
                <input
                  type="date"
                  value={formValidTo}
                  onChange={(e) => setFormValidTo(e.target.value)}
                  min={formValidFrom || undefined}
                  className={inputClassName}
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  Usage Limit
                  <span className="text-slate-500 font-normal">(optional, blank = unlimited)</span>
                </span>
              </label>
              <input
                type="number"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
                placeholder="e.g. 20 (leave blank for unlimited)"
                min={1}
                className={`${inputClassName} max-w-xs`}
              />
            </div>

            {/* Trip Type Filter */}
            {tripTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Applicable Trip Types
                  <span className="text-slate-500 font-normal ml-1">(optional, blank = all trips)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowTripTypeFilter(!showTripTypeFilter)}
                  className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-600 transition-colors"
                >
                  {formTripTypeIds.length === 0
                    ? 'All trip types'
                    : `${formTripTypeIds.length} trip type${formTripTypeIds.length !== 1 ? 's' : ''} selected`}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showTripTypeFilter ? 'rotate-180' : ''}`} />
                </button>
                {showTripTypeFilter && (
                  <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                    {tripTypes.map((tt) => (
                      <label key={tt.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formTripTypeIds.includes(tt.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormTripTypeIds([...formTripTypeIds, tt.id]);
                            } else {
                              setFormTripTypeIds(formTripTypeIds.filter(id => id !== tt.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 bg-white text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
                        />
                        <span className="text-sm text-slate-600">{tt.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isCreating ? 'Creating...' : 'Create Promo Code'}
              </button>
            </div>
          </div>
        )}

        {/* Codes List */}
        {!showCreateForm && (
          <>
            {codes.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-1">No promo codes yet</p>
                <p className="text-sm text-slate-500">
                  Create your first promo code to start offering discounts to guests.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((code) => {
                  const status = getCodeStatus(code);
                  return (
                    <div
                      key={code.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <button
                            onClick={() => copyCode(code.code)}
                            className="font-mono text-lg font-bold text-cyan-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
                          >
                            {code.code}
                            {copiedCode === code.code ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <span className={`px-2 py-0.5 rounded text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-900">
                          {formatDiscount(code.discount_type, code.discount_value)}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          <span className="text-xs text-slate-400">
                            Used: <span className="text-slate-900">{code.current_uses}{code.max_uses !== null ? `/${code.max_uses}` : ''}</span>
                          </span>
                          <span className="text-xs text-slate-400">
                            Discounts: <span className="text-slate-900">{formatCents(code.total_discount_cents)}</span>
                          </span>
                          <span className="text-xs text-slate-400">
                            Revenue: <span className="text-slate-900">{formatCents(code.total_booking_revenue_cents)}</span>
                          </span>
                          {code.valid_from && (
                            <span className="text-xs text-slate-400">
                              From: <span className="text-slate-900">{code.valid_from}</span>
                            </span>
                          )}
                          {code.valid_to && (
                            <span className="text-xs text-slate-400">
                              To: <span className="text-slate-900">{code.valid_to}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleToggle(code.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            code.is_active
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title={code.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        {code.current_uses === 0 && (
                          <button
                            onClick={() => handleDelete(code.id)}
                            className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
