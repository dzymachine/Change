interface ImpactCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}

export function ImpactCard({ title, value, subtitle, icon }: ImpactCardProps) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}
