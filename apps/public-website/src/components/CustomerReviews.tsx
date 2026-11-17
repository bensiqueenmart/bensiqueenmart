import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, CheckCircle2, MessageSquare, ExternalLink, Quote, ThumbsUp } from 'lucide-react';
import { useReviews } from '../context/ReviewsContext';
import { STORE_CONFIG } from '../config/storeConfig';
import { HOME } from '../config/siteContent';

export const CustomerReviews: React.FC = () => {
  const { activeReviews } = useReviews();
  const [currentPage, setCurrentPage] = useState(0);

  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(activeReviews.length / perPage));
  const visibleReviews = activeReviews.slice(currentPage * perPage, currentPage * perPage + perPage);

  const googleReviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Bensi Queen Grocery store ${STORE_CONFIG.address}`
  )}`;

  const RATING_BARS = HOME.ratingBars;

  return (
    <section className="relative bg-[#123B26] text-white overflow-hidden py-20 sm:py-28">

      {/* Background art */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-[#205C38]/40" />
        <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-[#A8C66C]/8" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, #A8C66C 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Section header ── */}
        <div className="text-center space-y-3 mb-14">
          <span className="inline-flex items-center space-x-2 bg-[#205C38]/60 border border-[#A8C66C]/25 text-[#A8C66C] px-5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest">
            <Star className="w-3 h-3 fill-[#F2C94C] text-[#F2C94C]" />
            <span>Customer Feedback</span>
          </span>
          <h2 className="font-playfair text-3xl sm:text-5xl font-extrabold text-white">
            What Our Customers Say
          </h2>
          <p className="font-poppins text-sm text-white/55 max-w-xl mx-auto">
            Good Food, Happy Homes, Happy Customers — genuine feedback from households in Chitlapakkam and Chennai.
          </p>
        </div>

        {activeReviews.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* ── Left: Rating Summary ── */}
            <div className="lg:col-span-4 flex flex-col space-y-6">

              {/* Big rating card */}
              <div className="bg-[#205C38]/50 border border-[#A8C66C]/20 rounded-3xl p-8 flex flex-col items-center text-center">
                <span className="font-playfair text-[80px] font-black text-[#A8C66C] leading-none">4.9</span>
                <div className="flex space-x-1 mt-2">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-[#F2C94C] text-[#F2C94C]" />)}
                </div>
                <p className="text-xs text-white/50 mt-2 font-poppins">
                  Based on <span className="text-white font-semibold">{activeReviews.length}</span> verified {activeReviews.length === 1 ? 'review' : 'reviews'}
                </p>

                {/* Rating breakdown */}
                <div className="w-full mt-6 space-y-2">
                  {RATING_BARS.map(({ stars, pct }) => (
                    <div key={stars} className="flex items-center space-x-2.5">
                      <span className="text-[11px] font-bold text-white/50 w-3 text-right flex-shrink-0">{stars}</span>
                      <Star className="w-3 h-3 fill-[#F2C94C] text-[#F2C94C] flex-shrink-0" />
                      <div className="flex-1 h-1.5 bg-[#123B26]/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F2C94C] rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-white/40 w-6 text-right flex-shrink-0">{pct}%</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 w-full pt-5 border-t border-white/[0.08] flex flex-col space-y-2.5">
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-full bg-[#A8C66C] hover:bg-[#97b55b] text-[#123B26] font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
                  >
                    <Star className="w-3.5 h-3.5 fill-[#123B26]" />
                    <span>Review on Google</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <div className="flex items-center justify-center space-x-1.5 text-[11px] text-white/35">
                    <CheckCircle2 className="w-3 h-3 text-[#A8C66C]" />
                    <span>All reviews are owner-verified</span>
                  </div>
                </div>
              </div>

              {/* Pagination dots */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="w-9 h-9 rounded-full bg-[#205C38]/60 hover:bg-[#205C38] border border-[#A8C66C]/20 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#A8C66C]" />
                  </button>
                  <span className="text-xs text-white/40 font-poppins">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage === totalPages - 1}
                    className="w-9 h-9 rounded-full bg-[#205C38]/60 hover:bg-[#205C38] border border-[#A8C66C]/20 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-[#A8C66C]" />
                  </button>
                </div>
              )}
            </div>

            {/* ── Right: Review Cards ── */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5 content-start">
              {visibleReviews.map((review, i) => (
                <div
                  key={review.id}
                  className={`bg-[#205C38]/40 border border-[#A8C66C]/15 rounded-2xl p-6 hover:border-[#A8C66C]/40 hover:-translate-y-1 hover:bg-[#205C38]/60 transition-all duration-300 flex flex-col space-y-4 relative overflow-hidden ${
                    i === 0 ? 'md:col-span-2' : ''
                  }`}
                >
                  {/* Decorative quote */}
                  <Quote className="absolute top-4 right-4 w-10 h-10 text-[#A8C66C]/10 rotate-180" />

                  {/* Stars + badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= review.rating ? 'fill-[#F2C94C] text-[#F2C94C]' : 'text-white/20'}`}
                        />
                      ))}
                      <span className="text-xs font-bold text-white/70 ml-1.5">{review.rating}.0</span>
                    </div>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#A8C66C] bg-[#A8C66C]/10 border border-[#A8C66C]/25 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Verified Order</span>
                      </span>
                    )}
                  </div>

                  {/* Review text */}
                  <p className="font-poppins text-sm text-white/75 leading-relaxed italic flex-1">
                    &ldquo;{review.reviewText}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-[#A8C66C] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#123B26] font-black text-sm">
                          {review.authorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{review.authorName}</p>
                        <p className="text-[11px] text-white/40">{review.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-0.5">
                      <span className="text-[10px] text-white/35">{review.reviewDate}</span>
                      {review.verifiedPurchase && (
                        <span className="text-[10px] text-[#A8C66C]/60 flex items-center space-x-0.5">
                          <ThumbsUp className="w-2.5 h-2.5" />
                          <span>Helpful</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          /* Empty state */
          <div className="bg-[#205C38]/40 border border-[#A8C66C]/20 rounded-3xl p-16 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#A8C66C]/20 flex items-center justify-center mx-auto mb-5">
              <MessageSquare className="w-8 h-8 text-[#A8C66C] opacity-60" />
            </div>
            <h3 className="font-playfair text-2xl font-bold text-white mb-2">No Reviews Yet</h3>
            <p className="text-sm text-white/50 font-poppins mb-6">
              Customer feedback will appear here once verified and approved by the store owner.
            </p>
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-full bg-[#A8C66C] text-[#123B26] font-bold text-sm transition-all hover:bg-[#97b55b]"
            >
              <span>Be the First to Review</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

      </div>
    </section>
  );
};
