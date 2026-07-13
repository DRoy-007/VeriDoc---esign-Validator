export type IconProps = { className?: string };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function ShieldIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>);
}
export function UploadIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M12 16V4M6 10l6-6 6 6M4 20h16" /></svg>);
}
export function CheckIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M4 12l5 5L20 6" /></svg>);
}
export function XIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M6 6l12 12M18 6L6 18" /></svg>);
}
export function ClockIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
}
export function ShieldAlertIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M12 9v4M12 16.5v.5" /></svg>);
}
export function FileIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path d="M14 3v5h5" /></svg>);
}
export function LockIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>);
}
export function StampIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M4 20h16M6 17h12l-1-4h-4l1-4a3 3 0 10-4 0l1 4H7l-1 4z" /></svg>);
}
export function ReportIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>);
}
export function CloudIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><path d="M7 18h10a4 4 0 000-8 6 6 0 00-11.6-1.5A3.5 3.5 0 007 18z" /></svg>);
}
export function DeviceIcon({ className }: IconProps) {
  return (<svg viewBox="0 0 24 24" className={className} {...stroke}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
}
