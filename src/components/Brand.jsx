export default function Brand({ compact = false, light = false }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/prastav-logo.png" alt="Prastav logo" className={`${compact ? "h-10 w-10" : "h-12 w-12"} rounded-xl object-contain bg-white`} />
      {!compact && <div className="min-w-0">
        <div className={`text-[19px] font-extrabold tracking-[0.12em] leading-none ${light ? "text-white" : "text-[#102b59]"}`}>PRASTAV</div>
        <div className={`mt-1 text-[9px] font-medium tracking-wide ${light ? "text-blue-100" : "text-slate-500"}`}>Transforming Proposals into Decisions.</div>
      </div>}
    </div>
  );
}
