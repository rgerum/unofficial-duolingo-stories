import React from "react";

export function Spinner() {
  return (
    <div className="relative h-[200px] w-full">
      <div className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-3">
        <div className="h-[18px] w-[18px] animate-[spinnerFade1_1.2s_ease-in-out_infinite] rounded-full bg-[#e5e5e5]" />
        <div className="h-[18px] w-[18px] animate-[spinnerFade2_1.2s_ease-in-out_infinite] rounded-full bg-[#e5e5e5]" />
        <div className="h-[18px] w-[18px] animate-[spinnerFade3_1.2s_ease-in-out_infinite] rounded-full bg-[#e5e5e5]" />
      </div>
    </div>
  );
}

export function SpinnerBlue() {
  return (
    <div className="relative inline-block h-5 w-5">
      <div className="absolute left-1/2 top-[70%] grid -translate-x-1/2 -translate-y-1/2 grid-cols-3 gap-[2px]">
        <div className="h-1 w-1 animate-[spinnerFade1_1.2s_ease-in-out_infinite] rounded-full bg-[#0089e5]" />
        <div className="h-1 w-1 animate-[spinnerFade2_1.2s_ease-in-out_infinite] rounded-full bg-[#0089e5]" />
        <div className="h-1 w-1 animate-[spinnerFade3_1.2s_ease-in-out_infinite] rounded-full bg-[#0089e5]" />
      </div>
    </div>
  );
}
