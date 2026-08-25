'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ─── Icons (inline SVG) ───────────────────────────────────────────────────

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function LogIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 8 12 12 14 14" />
      <path d="M3.05 11a9 9 0 1 0 .5-4" />
      <polyline points="3 3 3 7 7 7" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M12 2v2m0 18v-2m10-8h-2M4 12H2m15.66-6.34-1.42 1.42M7.76 16.24l-1.42 1.42m0-11.32 1.42 1.42m9.9 9.9-1.42-1.42" />
    </svg>
  )
}

// ─── Nav config ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/',         label: 'Dashboard', Icon: DashboardIcon, exact: true },
  { href: '/calendar', label: 'Calendar',  Icon: CalendarIcon,  exact: false },
  { href: '/log',      label: 'Log',       Icon: LogIcon,       exact: false },
  { href: '/history',  label: 'History',   Icon: HistoryIcon,   exact: false },
  { href: '/admin',    label: 'Admin',     Icon: AdminIcon,     exact: false },
]

// ─── Component ────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Listen to screen size to toggle mobile structures
  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)')
    setIsMobile(media.matches)
    const listener = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      if (!e.matches) setIsOpen(false) // auto close overlay if resizing to desktop
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  // Auto close drawer when page route transitions
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const sidebarContent = (
    <>
      {/* Header section with brand */}
      <div
        style={{
          padding: '20px 20px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            background: 'var(--accent)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '15px',
            color: '#0f1115',
            flexShrink: 0,
          }}
        >
          S
        </div>
        <span
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.3px',
            flex: 1,
          }}
        >
          Study
        </span>

        {/* Mobile close button inside the drawer */}
        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                marginBottom: '2px',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <Icon />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: '12px',
          flexShrink: 0,
        }}
      >
        Single-user · No auth
      </div>
    </>
  )

  // ── Mobile Rendering ───────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <>
        {/* Floating top bar */}
        <header
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            background: 'rgba(20, 22, 27, 0.88)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 400,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: '#0f1115' }}>S</div>
            <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>Study</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ☰
          </button>
        </header>

        {/* Overlay backdrop */}
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="animate-fade-in"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(3px)',
              zIndex: 490,
            }}
          />
        )}

        {/* Sliding sidebar container */}
        <aside
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '240px',
            background: '#14161b',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 500,
            transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
            boxShadow: isOpen ? '20px 0 60px rgba(0,0,0,0.6)' : 'none',
          }}
        >
          {sidebarContent}
        </aside>
      </>
    )
  }

  // ── Desktop Rendering ──────────────────────────────────────────────────────

  return (
    <aside
      style={{
        width: '232px',
        flexShrink: 0,
        background: '#14161b',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {sidebarContent}
    </aside>
  )
}
