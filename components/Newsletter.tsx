import React, { useMemo } from 'react';
import { SOCIAL_LINKS } from '../constants';

function stripTrailingSlashes(url: string): string {
  return (url || '').trim().replace(/\/+$/, '');
}

function toSubstackSubscribeUrl(publicationUrl: string): string {
  const clean = stripTrailingSlashes(publicationUrl);
  if (!clean || clean === '#') return 'https://substack.com/subscribe';
  return `${clean}/subscribe`;
}

export default function Newsletter() {
  const publicationUrl = (SOCIAL_LINKS.newsletter || '').trim();
  const subscribeUrl = useMemo(() => toSubstackSubscribeUrl(publicationUrl), [publicationUrl]);

  return (
    <section className="border-t border-zinc-800 bg-black">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="text-orange-500 text-[10px] font-black tracking-[0.2em] uppercase mb-3">
            Subscriber Uplink
          </div>

          <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-white leading-[1.05]">
            Get Field Intel by Email
          </h3>

          <p className="mt-4 text-zinc-300 text-sm md:text-base leading-relaxed">
            Subscribe via Substack. Same list, same delivery — NerdX stays the front door.
          </p>

          <div className="mt-6">
            <a
              href={subscribeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-[11px] hover:bg-yellow-400 hover:text-black transition-colors shadow-[6px_6px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Subscribe
            </a>
          </div>

          <div className="mt-4 text-[11px] text-zinc-500 font-mono">
            Opens Substack’s subscribe page in a new tab.
          </div>
        </div>
      </div>
    </section>
  );
}
