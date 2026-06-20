import { TrendingUp, TrendingDown } from 'lucide-react';
import { classNames } from '../../utils/helpers';

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

const KPICard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendValue }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value ?? '-'}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        {trend !== undefined && (
          <div className={classNames('flex items-center gap-1 mt-2 text-xs font-medium', trend >= 0 ? 'text-green-600' : 'text-red-600')}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trendValue || trend)}% vs last period
          </div>
        )}
      </div>
      {Icon && (
        <div className={classNames('p-2.5 rounded-xl', colorMap[color])}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  </div>
);

export default KPICard;
