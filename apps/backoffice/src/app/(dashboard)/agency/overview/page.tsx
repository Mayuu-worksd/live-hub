import React from 'react';
import { Header } from '@/components/Header';
import { Widget } from '@/components/Widget';
import { Users, DollarSign, Mail } from 'lucide-react';

export default function AgencyOverview() {
  return (
    <div className="flex flex-col min-h-full">
      <Header title="Agency Overview" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Widget title="Active Creators" value="0" icon={Users} />
          <Widget title="Period Commission" value="$0.00" icon={DollarSign} />
          <Widget title="Pending Invites" value="0" icon={Mail} />
        </div>
      </div>
    </div>
  );
}
