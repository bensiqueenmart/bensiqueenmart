import React from 'react';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

import { BLOG } from '../config/siteContent';
import type { BlogArticle } from '../types/content';

const ARTICLES: BlogArticle[] = BLOG;

export const BlogPreview: React.FC = () => {
  return (
    <section id="blog" className="py-16 bg-white border-t border-[#B9E769]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-[#B9E769]/40 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider text-[#155B32] font-bold">
              <BookOpen className="w-4 h-4 text-[#155B32]" />
              <span>Grocery Knowledge & Recipes</span>
              <span>•</span>
              <span className="font-kavivanar text-[#155B32]">சமையல் & மளிகைக் குறிப்புகள்</span>
            </div>
            <h2 className="font-playfair text-2xl sm:text-4xl font-bold text-[#155B32] mt-1">
              Food Wisdom from Bensi Queen
            </h2>
            <p className="font-mukta text-xs sm:text-sm text-gray-600 mt-1">
              Helpful insights on choosing authentic ingredients, wholesome cooking, and storage tips.
            </p>
          </div>
          <span className="text-xs text-[#155B32] font-semibold bg-[#F4F9EC] border border-[#B9E769] px-3 py-1.5 rounded-full self-start md:self-auto">
            Knowledge Hub
          </span>
        </div>

        {/* 4 Article Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ARTICLES.map((article) => (
            <article
              key={article.id}
              className="bg-[#F8F8F2] rounded-2xl border border-gray-200 overflow-hidden shadow-soft hover:shadow-card transition-all flex flex-col group hover:-translate-y-1"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img
                  src={article.image}
                  alt={article.titleEn}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-[#155B32] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {article.category}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center text-[11px] text-gray-500 space-x-1.5">
                    <Clock className="w-3 h-3 text-[#155B32]" />
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="font-playfair text-sm font-bold text-[#155B32] group-hover:text-[#75D900] transition-colors leading-snug">
                    {article.titleEn}
                  </h3>

                  <p className="font-mukta text-xs text-[#155B32]/80 font-medium">
                    {article.titleTa}
                  </p>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {article.excerptEn}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs font-semibold text-[#155B32] group-hover:text-[#75D900]">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

