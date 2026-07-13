/**
 * India-themed decorative backdrop.
 * Colored line-art motifs: Ashoka Chakra, lotus, paisley (mango),
 * mandala, temple arch, diya, peacock feather. All strokes only,
 * saffron / navy / green palette echoing the Indian flag.
 */
export function IndiaBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* soft wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 15% 0%, rgba(255,153,51,0.10), transparent 60%), radial-gradient(1000px 600px at 90% 20%, rgba(19,136,8,0.09), transparent 60%), radial-gradient(900px 700px at 50% 100%, rgba(0,0,128,0.07), transparent 60%)",
        }}
      />

      {/* line-art tiles */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.55]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Ashoka-chakra inspired repeating motif */}
          <pattern
            id="india-motif"
            x="0"
            y="0"
            width="220"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            {/* chakra */}
            <g
              transform="translate(55 55)"
              fill="none"
              stroke="#000080"
              strokeWidth="1"
              opacity="0.35"
            >
              <circle cx="0" cy="0" r="26" />
              <circle cx="0" cy="0" r="20" />
              {Array.from({ length: 24 }).map((_, i) => {
                const a = (i * Math.PI) / 12;
                return (
                  <line
                    key={i}
                    x1={Math.cos(a) * 4}
                    y1={Math.sin(a) * 4}
                    x2={Math.cos(a) * 26}
                    y2={Math.sin(a) * 26}
                  />
                );
              })}
            </g>

            {/* lotus */}
            <g
              transform="translate(160 45)"
              fill="none"
              stroke="#c2410c"
              strokeWidth="1.1"
              opacity="0.5"
            >
              {[-60, -30, 0, 30, 60].map((r) => (
                <path
                  key={r}
                  transform={`rotate(${r})`}
                  d="M0 0 C -8 -20 -4 -34 0 -40 C 4 -34 8 -20 0 0 Z"
                />
              ))}
              <path d="M-30 2 Q0 12 30 2" />
            </g>

            {/* paisley / mango */}
            <g
              transform="translate(40 170)"
              fill="none"
              stroke="#138808"
              strokeWidth="1.1"
              opacity="0.5"
            >
              <path d="M0 0 C -14 -6 -22 -22 -14 -36 C -2 -52 22 -46 26 -28 C 30 -12 16 4 0 0 Z" />
              <path d="M-8 -14 C -6 -22 0 -28 8 -28" />
              <circle cx="-4" cy="-20" r="1.4" fill="#138808" />
            </g>

            {/* temple arch */}
            <g
              transform="translate(170 175)"
              fill="none"
              stroke="#b45309"
              strokeWidth="1.1"
              opacity="0.5"
            >
              <path d="M-22 20 L-22 -4 Q-22 -22 0 -22 Q22 -22 22 -4 L22 20 Z" />
              <line x1="-22" y1="8" x2="22" y2="8" />
              <path d="M0 -22 L0 -30 M-3 -30 L3 -30" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#india-motif)" />
      </svg>

      {/* mandala corner */}
      <svg
        className="absolute -left-24 -top-24 h-96 w-96 opacity-30"
        viewBox="-100 -100 200 200"
      >
        <g fill="none" stroke="#ff9933" strokeWidth="0.8">
          <circle r="90" />
          <circle r="70" />
          <circle r="50" />
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i * Math.PI) / 8;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 30}
                y1={Math.sin(a) * 30}
                x2={Math.cos(a) * 90}
                y2={Math.sin(a) * 90}
              />
            );
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6;
            const x = Math.cos(a) * 60;
            const y = Math.sin(a) * 60;
            return <circle key={i} cx={x} cy={y} r="8" />;
          })}
        </g>
      </svg>

      {/* peacock feather bottom-right */}
      <svg
        className="absolute -right-16 bottom-0 h-96 w-96 opacity-35"
        viewBox="-100 -100 200 200"
      >
        <g fill="none" strokeWidth="0.9">
          {[-40, -20, 0, 20, 40].map((r, i) => (
            <g key={r} transform={`rotate(${r})`}>
              <path
                d="M0 60 Q -6 0 0 -70 Q 6 0 0 60"
                stroke={i % 2 ? "#0e7490" : "#065f46"}
              />
              <ellipse cx="0" cy="-60" rx="8" ry="14" stroke="#1e40af" />
              <circle cx="0" cy="-60" r="3" stroke="#b45309" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
