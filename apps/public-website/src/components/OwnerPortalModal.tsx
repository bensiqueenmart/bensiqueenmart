import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  ShieldCheck,
  Tag,
  Star,
  MessageSquare,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  Eye,
  Clock,
  Send,
  FileEdit,
} from 'lucide-react';
import { useOffers } from '../context/OffersContext';
import { useReviews } from '../context/ReviewsContext';
import { ComboOffer, OfferType, OfferStatus, CustomerReview } from '../types';
import { DealCard } from './DealCard';

const PRESET_IMAGES = [
  { label: 'Turmeric Powder', url: '/images/turmeric-powder.jpg' },
  { label: 'Idli Rice', url: '/images/idli-rice.jpg' },
  { label: 'Toor Dal', url: '/images/toor-dal.jpg' },
  { label: 'Nuts & Cashews', url: '/images/nuts-and-dry-fruits.jpg' },
  { label: 'South Masalas', url: '/images/south-masalas.jpg' },
  { label: 'Rice & Grains', url: '/images/rice-and-grains.jpg' },
  { label: 'Pulses & Lentils', url: '/images/pulses-and-lentils.jpg' },
  { label: 'Cooking Oils', url: '/images/cooking-oils.jpg' },
];

export const OwnerPortalModal: React.FC = () => {
  const {
    offers,
    activeOffers,
    draftOffers,
    expiredOffers,
    addOffer,
    updateOffer,
    deleteOffer,
    setOfferStatus,
    isOwnerModalOpen,
    setIsOwnerModalOpen,
    resetToDefaults: resetOffersToDefaults,
  } = useOffers();

  const {
    reviews,
    addReview,
    updateReview,
    deleteReview,
    toggleApproval,
    resetToDefaultReviews,
  } = useReviews();

  const [activeTab, setActiveTab] = useState<'offers' | 'reviews'>('offers');
  const [offerSubFilter, setOfferSubFilter] = useState<'all' | 'active' | 'draft' | 'expired'>('all');

  // Offer Form State
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [offerForm, setOfferForm] = useState<{
    title: string;
    description: string;
    offerType: OfferType;
    discountPercentage: number;
    discountLabel: string;
    image: string;
    startDate: string;
    endDate: string;
    validUntil: string;
    termsAndConditions: string;
    ctaText: string;
    status: OfferStatus;
  }>({
    title: '',
    description: '',
    offerType: 'percentage_discount',
    discountPercentage: 10,
    discountLabel: '10% DISCOUNT',
    image: PRESET_IMAGES[0].url,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    validUntil: 'Valid through 31 Dec 2026',
    termsAndConditions: 'Available for WhatsApp orders while stocks last.',
    ctaText: 'Claim Offer on WhatsApp',
    status: 'active',
  });

  // Review Form State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState<{
    authorName: string;
    location: string;
    reviewText: string;
    rating: number;
    reviewDate: string;
    verifiedPurchase: boolean;
    isApproved: boolean;
    isSample: boolean;
  }>({
    authorName: '',
    location: 'Chitlapakkam, Chennai',
    reviewText: '',
    rating: 5,
    reviewDate: 'November 2026',
    verifiedPurchase: true,
    isApproved: true,
    isSample: false,
  });

  if (!isOwnerModalOpen) return null;

  // Handlers for Offers
  const handleStartCreateOffer = () => {
    setEditingOfferId(null);
    setOfferForm({
      title: '',
      description: '',
      offerType: 'percentage_discount',
      discountPercentage: 10,
      discountLabel: '10% DISCOUNT',
      image: PRESET_IMAGES[0].url,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      validUntil: 'Valid through 31 Dec 2026',
      termsAndConditions: 'Available for WhatsApp orders while stocks last.',
      ctaText: 'Claim Offer on WhatsApp',
      status: 'active',
    });
    setShowOfferForm(true);
  };

  const handleStartEditOffer = (offer: ComboOffer) => {
    setEditingOfferId(offer.id);
    setOfferForm({
      title: offer.title,
      description: offer.description,
      offerType: offer.offerType,
      discountPercentage: offer.discountPercentage ?? 10,
      discountLabel: offer.discountLabel,
      image: offer.image,
      startDate: offer.startDate ?? new Date().toISOString().split('T')[0],
      endDate: offer.endDate ?? '',
      validUntil: offer.validUntil,
      termsAndConditions: offer.termsAndConditions,
      ctaText: offer.ctaText ?? 'Inquire on WhatsApp',
      status: offer.status,
    });
    setShowOfferForm(true);
  };

  const handleSaveOffer = (targetStatus?: OfferStatus) => {
    if (!offerForm.title.trim() || !offerForm.description.trim()) {
      alert('Please provide both Offer Title and Short Description.');
      return;
    }

    const finalStatus: OfferStatus = targetStatus ?? offerForm.status;

    // Auto compute discountLabel if left default
    let computedLabel = offerForm.discountLabel;
    if (offerForm.offerType === 'percentage_discount') {
      computedLabel = `${offerForm.discountPercentage}% OFF`;
    } else if (offerForm.offerType === 'bogo') {
      computedLabel = 'BUY 1 GET 1';
    } else if (offerForm.offerType === 'fixed_combo') {
      computedLabel = offerForm.discountLabel || 'COMBO SAVINGS';
    } else if (offerForm.offerType === 'announcement') {
      computedLabel = offerForm.discountLabel || 'SPECIAL ANNOUNCEMENT';
    }

    const offerPayload = {
      ...offerForm,
      discountLabel: computedLabel,
      status: finalStatus,
      isActive: finalStatus === 'active',
      validUntil: offerForm.validUntil || (offerForm.endDate ? `Valid until ${offerForm.endDate}` : 'Limited Time'),
    };

    if (editingOfferId) {
      updateOffer(editingOfferId, offerPayload);
      setEditingOfferId(null);
    } else {
      addOffer(offerPayload);
    }
    setShowOfferForm(false);
  };

  // Handlers for Reviews
  const handleStartEditReview = (rev: CustomerReview) => {
    setEditingReviewId(rev.id);
    setReviewForm({
      authorName: rev.authorName,
      location: rev.location,
      reviewText: rev.reviewText,
      rating: rev.rating,
      reviewDate: rev.reviewDate,
      verifiedPurchase: rev.verifiedPurchase,
      isApproved: rev.isApproved,
      isSample: rev.isSample,
    });
    setShowReviewForm(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.authorName.trim() || !reviewForm.reviewText.trim()) {
      alert('Please fill in customer name and review text.');
      return;
    }
    if (editingReviewId) {
      updateReview(editingReviewId, reviewForm);
      setEditingReviewId(null);
    } else {
      addReview(reviewForm);
    }
    setShowReviewForm(false);
  };

  // Filtered offers list based on owner subFilter
  const displayedOffers = offers.filter((o) => {
    if (offerSubFilter === 'active') return activeOffers.some((a) => a.id === o.id);
    if (offerSubFilter === 'draft') return o.status === 'draft';
    if (offerSubFilter === 'expired') return expiredOffers.some((e) => e.id === o.id);
    return true; // 'all'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOwnerModalOpen(false)}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 relative z-10">
        <div className="w-full max-w-5xl bg-[#F7F5E8] rounded-3xl shadow-2xl overflow-hidden border border-[#A8C66C] flex flex-col my-8">
          
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#123B26] text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#F2C94C] text-[#123B26] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-playfair text-xl sm:text-2xl font-bold">
                  Bensi Queen Owner Portal
                </h2>
                <p className="font-poppins text-xs text-[#A8C66C]">
                  Deals & Offers Management System • Customer Review Moderation
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOwnerModalOpen(false)}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Tab Navigation */}
          <div className="bg-[#F7F5E8] border-b border-[#DCE8C8] px-6 pt-3 flex space-x-6">
            <button
              onClick={() => setActiveTab('offers')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
                activeTab === 'offers'
                  ? 'border-[#123B26] text-[#123B26]'
                  : 'border-transparent text-gray-500 hover:text-[#123B26]'
              }`}
            >
              <Tag className="w-4 h-4 text-[#205C38]" />
              <span>Deals & Offers Management ({activeOffers.length} Active)</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all ${
                activeTab === 'reviews'
                  ? 'border-[#123B26] text-[#123B26]'
                  : 'border-transparent text-gray-500 hover:text-[#123B26]'
              }`}
            >
              <Star className="w-4 h-4 text-[#F2C94C]" />
              <span>Customer Reviews ({reviews.length})</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] space-y-6">
            
            {/* ================================================================ */}
            {/* TAB 1: DEALS & OFFERS MANAGEMENT (REUSABLE TEMPLATE LIBRARY)     */}
            {/* ================================================================ */}
            {activeTab === 'offers' && (
              <div className="space-y-6">
                
                {/* Status Bar & Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DCE8C8] shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#123B26] mr-2">View:</span>
                    <button
                      type="button"
                      onClick={() => setOfferSubFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        offerSubFilter === 'all'
                          ? 'bg-[#123B26] text-white'
                          : 'bg-[#F7F5E8] text-gray-700 hover:bg-[#DCE8C8]'
                      }`}
                    >
                      All ({offers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferSubFilter('active')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        offerSubFilter === 'active'
                          ? 'bg-[#205C38] text-white'
                          : 'bg-[#F7F5E8] text-[#205C38] hover:bg-[#DCE8C8]'
                      }`}
                    >
                      Active ({activeOffers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferSubFilter('draft')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        offerSubFilter === 'draft'
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#F7F5E8] text-amber-700 hover:bg-[#DCE8C8]'
                      }`}
                    >
                      Drafts ({draftOffers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferSubFilter('expired')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                        offerSubFilter === 'expired'
                          ? 'bg-gray-600 text-white'
                          : 'bg-[#F7F5E8] text-gray-500 hover:bg-[#DCE8C8]'
                      }`}
                    >
                      Expired ({expiredOffers.length})
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (showOfferForm) {
                          setShowOfferForm(false);
                        } else {
                          handleStartCreateOffer();
                        }
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#205C38] text-white hover:bg-[#123B26] text-xs font-bold shadow-button transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#F2C94C]" />
                      <span>{showOfferForm ? 'Close Template' : 'New Offer Template'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetOffersToDefaults}
                      className="px-3 py-2 rounded-xl bg-[#DCE8C8] text-[#123B26] hover:bg-[#A8C66C] text-xs font-semibold transition-colors"
                      title="Reset to default store templates"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>

                {/* REUSABLE OFFER TEMPLATE CREATION / EDITING FORM */}
                {showOfferForm && (
                  <div className="bg-white p-6 rounded-3xl border-2 border-[#205C38] shadow-card space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h4 className="font-playfair text-lg font-bold text-[#123B26]">
                          {editingOfferId ? 'Edit Offer in Template' : 'Create New Offer Template'}
                        </h4>
                        <p className="text-xs text-gray-500 font-poppins">
                          Fill in the fields below. The promotional card is generated automatically using the fixed 16:9 design template.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPreview(!showPreview)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-full bg-[#F7F5E8] text-[#123B26] text-xs font-bold border border-[#DCE8C8]"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#205C38]" />
                        <span>{showPreview ? 'Hide Preview' : 'Show Live Preview'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Form Inputs (7 cols) */}
                      <div className="lg:col-span-7 space-y-4">
                        
                        {/* 1. Offer Title */}
                        <div>
                          <label className="block text-xs font-bold text-[#123B26] mb-1">
                            1. Offer Title *
                          </label>
                          <input
                            type="text"
                            value={offerForm.title}
                            onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                            placeholder="e.g. Dry Fruits & Whole Nuts Pantry Bundle"
                            className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3.5 py-2 text-xs text-[#123B26] font-medium focus:outline-none focus:ring-2 focus:ring-[#205C38]"
                            required
                          />
                        </div>

                        {/* 2. Short Description */}
                        <div>
                          <label className="block text-xs font-bold text-[#123B26] mb-1">
                            2. Short Description *
                          </label>
                          <textarea
                            rows={3}
                            value={offerForm.description}
                            onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                            placeholder="Briefly describe what items are included in this promotion..."
                            className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl p-3 text-xs text-[#123B26] font-medium focus:outline-none focus:ring-2 focus:ring-[#205C38]"
                            required
                          />
                        </div>

                        {/* 3. Offer Type & 4. Discount Percentage */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#123B26] mb-1">
                              3. Offer Type
                            </label>
                            <select
                              value={offerForm.offerType}
                              onChange={(e) =>
                                setOfferForm({ ...offerForm, offerType: e.target.value as OfferType })
                              }
                              className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26] font-bold focus:outline-none focus:ring-2 focus:ring-[#205C38]"
                            >
                              <option value="percentage_discount">Percentage Discount</option>
                              <option value="bogo">Buy 1 Get 1 (BOGO)</option>
                              <option value="fixed_combo">Fixed Combo Offer</option>
                              <option value="announcement">Special Announcement</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#123B26] mb-1">
                              4. Discount Value / Label
                            </label>
                            {offerForm.offerType === 'percentage_discount' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="90"
                                  value={offerForm.discountPercentage}
                                  onChange={(e) =>
                                    setOfferForm({
                                      ...offerForm,
                                      discountPercentage: Number(e.target.value),
                                      discountLabel: `${e.target.value}% OFF`,
                                    })
                                  }
                                  className="w-24 bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26] font-bold"
                                />
                                <span className="text-xs text-gray-500 font-bold">% Discount</span>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={offerForm.discountLabel}
                                onChange={(e) =>
                                  setOfferForm({ ...offerForm, discountLabel: e.target.value })
                                }
                                placeholder="e.g. COMBO SAVINGS or BUY 1 GET 1"
                                className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26] font-medium"
                              />
                            )}
                          </div>
                        </div>

                        {/* 5. Promotional Image (16:9) */}
                        <div>
                          <label className="block text-xs font-bold text-[#123B26] mb-1">
                            5. Promotional Image (16:9 Aspect Ratio)
                          </label>
                          <input
                            type="url"
                            value={offerForm.image}
                            onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })}
                            placeholder="Image URL"
                            className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-1.5 text-xs text-[#123B26] mb-2"
                          />
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">
                              Presets:
                            </span>
                            {PRESET_IMAGES.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => setOfferForm({ ...offerForm, image: preset.url })}
                                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                                  offerForm.image === preset.url
                                    ? 'bg-[#205C38] text-white'
                                    : 'bg-[#F7F5E8] text-[#123B26] hover:bg-[#DCE8C8]'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 6. Start Date & 7. End Date */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#123B26] mb-1">
                              6. Start Date
                            </label>
                            <input
                              type="date"
                              value={offerForm.startDate}
                              onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                              className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#123B26] mb-1">
                              7. End Date (Auto-Expiry)
                            </label>
                            <input
                              type="date"
                              value={offerForm.endDate}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOfferForm({
                                  ...offerForm,
                                  endDate: val,
                                  validUntil: val ? `Valid through ${val}` : offerForm.validUntil,
                                });
                              }}
                              className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26]"
                            />
                          </div>
                        </div>

                        {/* 8. Terms and Conditions */}
                        <div>
                          <label className="block text-xs font-bold text-[#123B26] mb-1">
                            8. Terms and Conditions
                          </label>
                          <input
                            type="text"
                            value={offerForm.termsAndConditions}
                            onChange={(e) =>
                              setOfferForm({ ...offerForm, termsAndConditions: e.target.value })
                            }
                            placeholder="e.g. Valid for WhatsApp orders across Chitlapakkam while supplies last."
                            className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3.5 py-2 text-xs text-[#123B26]"
                          />
                        </div>

                        {/* 9. CTA Text & 10. Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#123B26] mb-1">
                              9. Call-to-Action Text
                            </label>
                            <input
                              type="text"
                              value={offerForm.ctaText}
                              onChange={(e) => setOfferForm({ ...offerForm, ctaText: e.target.value })}
                              placeholder="e.g. Inquire on WhatsApp"
                              className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#123B26] mb-1">
                              10. Offer Status
                            </label>
                            <select
                              value={offerForm.status}
                              onChange={(e) =>
                                setOfferForm({ ...offerForm, status: e.target.value as OfferStatus })
                              }
                              className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26] font-bold"
                            >
                              <option value="active">Active (Publish to Website)</option>
                              <option value="draft">Draft (Save for Later)</option>
                              <option value="inactive">Inactive (Hidden)</option>
                            </select>
                          </div>
                        </div>

                        {/* Form Buttons */}
                        <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveOffer('active')}
                            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#123B26] text-white hover:bg-[#205C38] text-xs font-bold shadow-button"
                          >
                            <Send className="w-3.5 h-3.5 text-[#F2C94C]" />
                            <span>Publish Offer Now</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveOffer('draft')}
                            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>Save as Draft</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowOfferForm(false)}
                            className="px-4 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold"
                          >
                            Cancel
                          </button>
                        </div>

                      </div>

                      {/* Live Template Preview (5 cols) */}
                      {showPreview && (
                        <div className="lg:col-span-5 space-y-3">
                          <div className="bg-[#F7F5E8] p-3 rounded-2xl border border-[#DCE8C8]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-[#123B26] uppercase tracking-wider">
                                Live Template Preview
                              </span>
                              <span className="text-[10px] text-gray-500 font-semibold">
                                16:9 Reusable Design
                              </span>
                            </div>

                            <DealCard
                              offer={{
                                id: 'preview-id',
                                title: offerForm.title || 'Sample Promotional Title',
                                description:
                                  offerForm.description ||
                                  'A preview of how this offer will appear on your homepage and offers page using the standardized Bensi Queen promotional template.',
                                offerType: offerForm.offerType,
                                discountLabel: offerForm.discountLabel || 'SPECIAL OFFER',
                                image: offerForm.image,
                                validUntil:
                                  offerForm.validUntil ||
                                  (offerForm.endDate ? `Valid until ${offerForm.endDate}` : 'Limited Time'),
                                termsAndConditions:
                                  offerForm.termsAndConditions || 'Available while stocks last.',
                                ctaText: offerForm.ctaText || 'Inquire on WhatsApp',
                                status: offerForm.status,
                                isActive: offerForm.status === 'active',
                                createdAt: new Date().toISOString(),
                              }}
                              isPreview={true}
                            />

                            <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                              Every offer published by the owner automatically adopts this exact design.
                            </p>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* OFFERS LIST (ALL, ACTIVE, DRAFTS, EXPIRED) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
                    <span>
                      Showing {displayedOffers.length} {offerSubFilter} offer(s)
                    </span>
                    <span>Click Actions to Edit, Publish or Delete</span>
                  </div>

                  {displayedOffers.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-[#DCE8C8] text-center space-y-2">
                      <Tag className="w-10 h-10 text-gray-400 mx-auto stroke-1" />
                      <p className="text-sm font-bold text-[#123B26]">No offers in this category</p>
                      <p className="text-xs text-gray-500">
                        Create a new offer template using the button above.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayedOffers.map((offer) => {
                        const isExpired = offer.endDate && offer.endDate < new Date().toISOString().split('T')[0];
                        return (
                          <div
                            key={offer.id}
                            className="bg-white p-4 rounded-2xl border border-[#DCE8C8] shadow-xs flex flex-col justify-between space-y-3"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-24 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={offer.image}
                                  alt={offer.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                      offer.status === 'active' && !isExpired
                                        ? 'bg-[#205C38] text-white'
                                        : offer.status === 'draft'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-gray-400 text-white'
                                    }`}
                                  >
                                    {isExpired ? 'Expired' : offer.status}
                                  </span>
                                  <span className="text-[10px] font-bold text-[#205C38]">
                                    {offer.discountLabel}
                                  </span>
                                </div>
                                <h5 className="font-playfair text-sm font-bold text-[#123B26] truncate mt-1">
                                  {offer.title}
                                </h5>
                                <p className="text-[11px] text-gray-500 line-clamp-1">
                                  {offer.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                              <span className="text-[10px] text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-[#205C38]" />
                                {offer.validUntil}
                              </span>

                              <div className="flex items-center space-x-1.5">
                                {offer.status !== 'active' ? (
                                  <button
                                    type="button"
                                    onClick={() => setOfferStatus(offer.id, 'active')}
                                    className="px-2.5 py-1 rounded-lg bg-[#205C38] text-white text-[11px] font-bold hover:bg-[#123B26]"
                                  >
                                    Publish
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setOfferStatus(offer.id, 'inactive')}
                                    className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-[11px] font-semibold hover:bg-gray-300"
                                  >
                                    Deactivate
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleStartEditOffer(offer)}
                                  className="p-1.5 rounded-lg bg-[#F7F5E8] text-[#123B26] hover:bg-[#DCE8C8]"
                                  title="Edit offer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete offer "${offer.title}"?`)) {
                                      deleteOffer(offer.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                                  title="Delete offer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ================================================================ */}
            {/* TAB 2: CUSTOMER REVIEWS MODERATION                               */}
            {/* ================================================================ */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#DCE8C8] shadow-soft">
                  <div>
                    <h3 className="text-sm font-bold text-[#123B26]">
                      Customer Reviews Moderation
                    </h3>
                    <p className="text-xs text-gray-500">
                      Approved reviews appear in &quot;What Our Customers Say&quot; on the homepage.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewForm({
                          authorName: '',
                          location: 'Chitlapakkam, Chennai',
                          reviewText: '',
                          rating: 5,
                          reviewDate: 'November 2026',
                          verifiedPurchase: true,
                          isApproved: true,
                          isSample: false,
                        });
                        setShowReviewForm(!showReviewForm);
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#205C38] text-white hover:bg-[#123B26] text-xs font-semibold shadow-button transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#F2C94C]" />
                      <span>{showReviewForm ? 'Cancel' : 'Add Real Review'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetToDefaultReviews}
                      className="px-3 py-2 rounded-xl bg-[#DCE8C8] text-[#123B26] hover:bg-[#A8C66C] text-xs font-medium transition-colors"
                    >
                      Reset Samples
                    </button>
                  </div>
                </div>

                {/* REVIEW FORM */}
                {showReviewForm && (
                  <form
                    onSubmit={handleSaveReview}
                    className="bg-white p-6 rounded-3xl border border-[#205C38] shadow-card space-y-4 animate-fade-in"
                  >
                    <h4 className="font-playfair text-lg font-bold text-[#123B26]">
                      {editingReviewId ? 'Edit Review' : 'Add Real Customer Review'}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#123B26] mb-1">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          value={reviewForm.authorName}
                          onChange={(e) => setReviewForm({ ...reviewForm, authorName: e.target.value })}
                          placeholder="e.g. S. Lakshmi"
                          className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26] font-medium"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#123B26] mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={reviewForm.location}
                          onChange={(e) => setReviewForm({ ...reviewForm, location: e.target.value })}
                          placeholder="e.g. Chitlapakkam, Chennai"
                          className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#123B26] mb-1">
                        Review Text *
                      </label>
                      <textarea
                        rows={3}
                        value={reviewForm.reviewText}
                        onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })}
                        placeholder="Genuine customer feedback on pulses, spices, delivery..."
                        className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl p-3 text-xs text-[#123B26]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#123B26] mb-1">
                          Star Rating
                        </label>
                        <select
                          value={reviewForm.rating}
                          onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                          className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs font-bold text-[#123B26]"
                        >
                          <option value={5}>5 Stars ★★★★★</option>
                          <option value={4}>4 Stars ★★★★☆</option>
                          <option value={3}>3 Stars ★★★☆☆</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#123B26] mb-1">
                          Review Date
                        </label>
                        <input
                          type="text"
                          value={reviewForm.reviewDate}
                          onChange={(e) => setReviewForm({ ...reviewForm, reviewDate: e.target.value })}
                          placeholder="e.g. November 2026"
                          className="w-full bg-[#F7F5E8] border border-[#DCE8C8] rounded-xl px-3 py-2 text-xs text-[#123B26]"
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id="isApproved"
                          checked={reviewForm.isApproved}
                          onChange={(e) => setReviewForm({ ...reviewForm, isApproved: e.target.checked })}
                          className="w-4 h-4 text-[#205C38] rounded focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="isApproved" className="text-xs font-bold text-[#123B26] cursor-pointer">
                          Approve for Public Display
                        </label>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center space-x-3">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-[#123B26] text-white hover:bg-[#205C38] text-xs font-bold shadow-button"
                      >
                        {editingReviewId ? 'Update Review' : 'Save Review'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* REVIEWS LIST */}
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white p-4 rounded-2xl border border-[#DCE8C8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-playfair font-bold text-[#123B26] text-sm">
                            {rev.authorName}
                          </span>
                          <span className="text-[11px] text-gray-500">• {rev.location}</span>
                          {rev.isSample && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded">
                              Sample Content
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              rev.isApproved
                                ? 'bg-[#DCE8C8] text-[#123B26]'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {rev.isApproved ? 'Approved' : 'Pending Moderation'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{rev.reviewText}</p>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => toggleApproval(rev.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            rev.isApproved
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-[#205C38] text-white hover:bg-[#123B26]'
                          }`}
                        >
                          {rev.isApproved ? 'Unpublish' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditReview(rev)}
                          className="p-1.5 rounded-lg bg-[#F7F5E8] text-[#123B26] hover:bg-[#DCE8C8]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete review from ${rev.authorName}?`)) {
                              deleteReview(rev.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-[#DCE8C8] flex items-center justify-between text-xs text-gray-500">
            <span>Bensi Queen Private Owner Panel • localStorage Persistent Storage</span>
            <button
              onClick={() => setIsOwnerModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#123B26] text-white font-bold text-xs"
            >
              Close Portal
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
