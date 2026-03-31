export const POLICY_REPORTER_HEADERS = [
  {
    name:     'policy',
    labelKey: 'openReport.headers.reportsTab.policy.label',
    value:    'policy',
    sort:     'policy'
  },
  {
    name:      'severity',
    labelKey:  'openReport.headers.reportsTab.severity.label',
    value:     'severity',
    sort:      'severitySort',
    align:     'center'
  },
  {
    name:      'result',
    labelKey:  'openReport.headers.reportsTab.result.label',
    value:     'result',
    sort:      'result',
    align:     'center'
  }
];

export const POLICY_REPORTER_GROUP_OPTIONS = [
  {
    value:      'none',
    icon:       'icon-list-flat',
    tooltipKey: 'openReport.grouping.none'
  },
  {
    value:         'severity',
    icon:          'icon-warning',
    field:         'severity',
    hideColumn:    'severity',
    groupLabelKey: 'severity',
    tooltipKey:    'openReport.grouping.severity'
  },
  {
    value:         'result',
    icon:          'icon-checkmark',
    field:         'result',
    hideColumn:    'result',
    groupLabelKey: 'result',
    tooltipKey:    'openReport.grouping.result'
  }
];
