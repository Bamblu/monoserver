import React from "react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0F172A] px-4 py-16">
      <div className="max-w-[1440px] w-full mx-auto flex flex-col gap-10">
        <div>
          <p className="text-white text-xl font-bold">Bamblu</p>
          <p className="text-[#94A3B8] text-sm mt-2 max-w-xs">
            Track Your Coding. Know Your Skill. Grow Your Career.
          </p>
        </div>

        <div className="h-px w-full bg-white/10" />

        <p className="text-[#94A3B8] text-xs">
          © {year} Bamblu. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;