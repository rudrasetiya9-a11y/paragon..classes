import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  change?: {
    value: string;
    label: string;
    positive?: boolean;
  };
}

export default function StatsCard({ title, value, icon: Icon, iconColor, change }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="text-xl" />
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={change.positive !== false ? "text-secondary" : "text-accent"}>
            {change.value}
          </span>
          <span className="text-neutral-500 ml-1">{change.label}</span>
        </div>
      )}
    </div>
  );
}
