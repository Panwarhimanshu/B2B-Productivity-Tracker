export const ROLES = {
  RM: 'RM',
  TEAM_LEAD: 'TEAM_LEAD',
  HOD: 'HOD',
};

export const ROLE_LABELS = {
  RM: 'Relationship Manager',
  TEAM_LEAD: 'Team Lead',
  HOD: 'Head of Department',
};

export const PERIODS = [
  { value: 'daily', label: 'Today' },
  { value: 'weekly', label: 'Last 7 Days' },
  { value: 'biweekly', label: 'Last 15 Days' },
  { value: 'monthly', label: 'Last 30 Days' },
];

export const REPORT_STATUS_COLORS = {
  Submitted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Modified: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};
