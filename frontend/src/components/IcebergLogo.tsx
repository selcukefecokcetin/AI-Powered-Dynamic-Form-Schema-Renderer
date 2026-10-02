import React from 'react';

interface IcebergLogoProps {
  className?: string;
}

export const IcebergLogo: React.FC<IcebergLogoProps> = ({ className = "w-10 h-10" }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Yuvarlatılmış Arka Plan Kutu */}
      <rect width="100" height="100" rx="22" fill="#FFFFFF" />

      {/* 4 Adet Izometrik Küp İkonu */}
      <g fill="#0F172A">
        {/* Sol Üst Küp */}
        <path d="M 36,24 L 46,30 L 36,36 L 26,30 Z M 26,32 L 34,37 L 34,48 L 26,42 Z M 38,37 L 46,32 L 46,42 L 38,48 Z" />
        {/* Sağ Üst Küp */}
        <path d="M 64,24 L 74,30 L 64,36 L 54,30 Z M 54,32 L 62,37 L 62,48 L 54,42 Z M 66,37 L 74,32 L 74,42 L 66,48 Z" />
        {/* Sol Alt Küp */}
        <path d="M 36,52 L 46,58 L 36,64 L 26,58 Z M 26,60 L 34,65 L 34,76 L 26,70 Z M 38,65 L 46,60 L 46,70 L 38,76 Z" />
        {/* Sağ Alt Küp */}
        <path d="M 64,52 L 74,58 L 64,64 L 54,58 Z M 54,60 L 62,65 L 62,76 L 54,70 Z M 66,65 L 74,60 L 74,70 L 66,76 Z" />
      </g>

      {/* Ortadaki Pembe/Magenta Üçgen */}
      <polygon points="48,46 54,50 48,54" fill="#E50914" />
    </svg>
  );
};