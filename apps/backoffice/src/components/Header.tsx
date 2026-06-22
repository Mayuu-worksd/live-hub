import React from 'react';

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export function Header({ title, actions }: HeaderProps) {
  return (
    <div className="bg-[#1A1A1A] border-b border-white/[0.06] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-2xl font-bold font-heading text-white tracking-tight">{title}</h1>
      {actions && <div className="flex items-center space-x-4">{actions}</div>}
    </div>
  );
}
