export const POLICY_REPORTER_HEADERS = [
  {
    name:     'policy',
    labelKey: 'policyReport.headers.policyReportsTab.policy.label',
    value:    'policy',
    sort:     'policy'
  },
  {
    name:      'severity',
    labelKey:  'policyReport.headers.policyReportsTab.severity.label',
    value:     'severity',
    sort:      'severitySort',
    align:     'center'
  },
  {
    name:      'status',
    labelKey:  'policyReport.headers.policyReportsTab.status.label',
    value:     'status',
    sort:      'result',
    align:     'center'
  }
];

export const POLICY_REPORTER_GROUP_OPTIONS = [
  {
    value:      'none',
    icon:       'icon-list-flat',
    tooltipKey: 'policyReport.grouping.none'
  },
  {
    value:         'severity',
    icon:          'icon-warning',
    field:         'severity',
    hideColumn:    'severity',
    groupLabelKey: 'severity',
    tooltipKey:    'policyReport.grouping.severity'
  },
  {
    value:         'result',
    icon:          'icon-checkmark',
    field:         'result',
    hideColumn:    'status',
    groupLabelKey: 'result',
    tooltipKey:    'policyReport.grouping.status'
  }
];
