'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MinimalistHeroProps {
  mainText: string;
  readMoreLink: string;
  imageSrc: string;
  imageAlt: string;
  overlayText: { part1: string; part2: string };
  socialLinks: { icon: LucideIcon; href: string; label: string }[];
  locationText: string;
}

export function MinimalistHero({
  mainText,
  readMoreLink,
  imageSrc,
  imageAlt,
  overlayText,
  socialLinks,
  locationText,
}: MinimalistHeroProps) {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: '#fff',
      padding: '0 48px 32px',
      boxSizing: 'border-box',
    }}>
      {/* Three-column content area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        alignItems: 'center',
        width: '100%',
        maxWidth: 1280,
        flex: 1,
        gap: 32,
      }}>

        {/* Left — descriptor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{ zIndex: 2 }}
        >
          <p style={{ fontSize: 15, lineHeight: 1.75, color: '#64748B', maxWidth: 280, margin: 0 }}>
            {mainText}
          </p>
          <a href={readMoreLink} style={{
            display: 'inline-block', marginTop: 16,
            fontSize: 13, fontWeight: 600, color: '#0EA5E9',
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            See how it works →
          </a>
        </motion.div>

        {/* Center — airplane + glow */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          {/* Radial glow circle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            style={{
              position: 'absolute',
              width: 'min(420px, 38vw)',
              height: 'min(420px, 38vw)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(14,165,233,0.04) 60%, transparent 100%)',
              zIndex: 0,
            }}
          />
          {/* Airplane image */}
          <motion.img
            src={imageSrc}
            alt={imageAlt}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(340px, 28vw)',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 16px 40px rgba(14,165,233,0.12))',
            }}
          />
        </div>

        {/* Right — big display text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ zIndex: 2 }}
        >
          <h1 style={{
            fontSize: 'clamp(56px, 6.5vw, 108px)',
            fontWeight: 900,
            lineHeight: 0.88,
            letterSpacing: '-4px',
            color: '#0F172A',
            margin: 0,
          }}>
            {overlayText.part1}
            <br />
            <span style={{ color: '#F97316' }}>{overlayText.part2}</span>
          </h1>
        </motion.div>
      </div>

      {/* Footer row */}
      <motion.footer
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: 1280,
        }}
      >
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          {socialLinks.map(({ icon: Icon, href, label }, i) => (
            <a key={i} href={href} aria-label={label} style={{ color: '#94A3B8', display: 'flex', transition: 'color 0.2s' }}>
              <Icon size={18} />
            </a>
          ))}
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#94A3B8', letterSpacing: '0.5px' }}>
          {locationText}
        </span>
      </motion.footer>
    </div>
  );
}
