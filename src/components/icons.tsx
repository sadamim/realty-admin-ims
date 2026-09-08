// Inline SVG icon set.
// Kept in-repo on purpose: no icon package is installed and the panel only
// needs a couple of dozen glyphs. All icons are 24x24, stroke-based and
// inherit `currentColor`, so they follow text colour everywhere.
import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/* --- Navigation ---------------------------------------------------------- */

export const IconDashboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="8" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="5" rx="1.6" />
    <rect x="13.5" y="11" width="7.5" height="10" rx="1.6" />
    <rect x="3" y="14" width="7.5" height="7" rx="1.6" />
  </Svg>
);

export const IconBuilding = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 21h18" />
    <path d="M5 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15" />
    <path d="M15 21V11h3a2 2 0 0 1 2 2v8" />
    <path d="M8.5 8h3M8.5 12h3M8.5 16h3" />
  </Svg>
);

export const IconHardHat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 17h19" />
    <path d="M4.5 17v-2.5a7.5 7.5 0 0 1 15 0V17" />
    <path d="M9.5 7.2V4.6A1.6 1.6 0 0 1 11.1 3h1.8a1.6 1.6 0 0 1 1.6 1.6v2.6" />
    <path d="M3.5 17h17a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1Z" />
  </Svg>
);

export const IconSparkles = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5 13.6 8 18 9.5 13.6 11 12 15.5 10.4 11 6 9.5 10.4 8 12 3.5Z" />
    <path d="M18.5 15.5 19.3 17.7 21.5 18.5 19.3 19.3 18.5 21.5 17.7 19.3 15.5 18.5 17.7 17.7 18.5 15.5Z" />
    <path d="M5 14l.6 1.6L7.2 16.2 5.6 16.8 5 18.4 4.4 16.8 2.8 16.2 4.4 15.6 5 14Z" />
  </Svg>
);

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15.5 20v-1.8a3.5 3.5 0 0 0-3.5-3.5H6.5A3.5 3.5 0 0 0 3 18.2V20" />
    <circle cx="9.25" cy="7.5" r="3.5" />
    <path d="M21 20v-1.8a3.5 3.5 0 0 0-2.7-3.4" />
    <path d="M15.5 4.2a3.5 3.5 0 0 1 0 6.6" />
  </Svg>
);

export const IconTag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12.4V4.8A1.8 1.8 0 0 1 4.8 3h7.6a2 2 0 0 1 1.4.6l6.6 6.6a2 2 0 0 1 0 2.8l-7.4 7.4a2 2 0 0 1-2.8 0L3.6 13.8a2 2 0 0 1-.6-1.4Z" />
    <circle cx="8" cy="8" r="1.4" />
  </Svg>
);

export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
    <path d="m3.5 12 8.5 4.5L20.5 12" />
    <path d="m3.5 16.5 8.5 4.5 8.5-4.5" />
  </Svg>
);

export const IconRupee = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10" />
    <path d="M7 8.5h10" />
    <path d="M13.5 4c2.4 0 3.5 1.7 3.5 3.6 0 2.6-2 4.4-5 4.4H7l7.5 8" />
  </Svg>
);

export const IconInbox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 13h4l1.2 2.4h6.6L16.5 13h4" />
    <path d="M5.7 4.5h12.6a2 2 0 0 1 1.85 1.24l1.35 6.9V17a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 17v-4.36l1.35-6.9A2 2 0 0 1 5.7 4.5Z" />
  </Svg>
);

export const IconFile = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V8l-5-5Z" />
    <path d="M14 3v3.5A1.5 1.5 0 0 0 15.5 8H19" />
    <path d="M8.5 13h7M8.5 16.5h4.5" />
  </Svg>
);

/* --- Chrome -------------------------------------------------------------- */

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const IconPanelLeft = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="M9.5 4v16" />
  </Svg>
);

export const IconLogout = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 21H6a2.5 2.5 0 0 1-2.5-2.5v-13A2.5 2.5 0 0 1 6 3h3.5" />
    <path d="m15.5 16 4-4-4-4" />
    <path d="M19.5 12H9" />
  </Svg>
);

export const IconArrowLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </Svg>
);

export const IconArrowUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 19V5" />
    <path d="m6 11 6-6 6 6" />
  </Svg>
);

export const IconEdit = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 4.5H6A2.5 2.5 0 0 0 3.5 7v11A2.5 2.5 0 0 0 6 20.5h11a2.5 2.5 0 0 0 2.5-2.5v-5" />
    <path d="M17.4 3.6a1.9 1.9 0 0 1 2.7 2.7L12.6 13.8 9 15l1.2-3.6 7.2-7.8Z" />
  </Svg>
);

export const IconFilter = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 5.5h17l-6.6 7.6V19l-3.8 2v-7.9L3.5 5.5Z" />
  </Svg>
);

export const IconSort = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4v16m0 0-3-3m3 3 3-3" />
    <path d="M17 20V4m0 0-3 3m3-3 3 3" />
  </Svg>
);

export const IconMapPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

export const IconImage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="8.75" cy="10" r="1.6" />
    <path d="m4 17 4.8-4.5a2 2 0 0 1 2.7 0L16 17" />
    <path d="m14 14.4 1.6-1.5a2 2 0 0 1 2.7 0L20.5 15" />
  </Svg>
);

export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7.2 3.5H5A2 2 0 0 0 3 5.7c0 8.2 7.1 15.3 15.3 15.3a2 2 0 0 0 2.2-2v-2.2a1.4 1.4 0 0 0-1.1-1.4l-3-.6a1.4 1.4 0 0 0-1.4.6l-.9 1.3a12.6 12.6 0 0 1-5.6-5.6l1.3-.9a1.4 1.4 0 0 0 .6-1.4l-.6-3a1.4 1.4 0 0 0-1.6-1.3Z" />
  </Svg>
);

/* --- Status -------------------------------------------------------------- */

export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
  </Svg>
);

export const IconAlertTriangle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9.5v4M12 17h.01" />
  </Svg>
);

export const IconAlertCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </Svg>
);

export const IconInfo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 8h.01" />
  </Svg>
);

export const IconSpinner = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </Svg>
);
