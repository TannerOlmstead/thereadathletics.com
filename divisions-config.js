/* THE READ Athletics - the ONE division / association config. Edit here only.
   Drives the Athletic Department tabs, labels, KPIs, roster fields, compliance sections and prospect eligibility statuses.
   No rule numbers are hardcoded: limits, dates and counts are entered by the department. Rules change; always verify with
   your compliance office and the official governing body. */
(function () {
  'use strict';
  var KEY = 'theReadDivision';
  var LINKS = {
    ncaa: [['NCAA Official Site', 'https://www.ncaa.org'], ['NCAA Eligibility Center', 'https://www.ncaa.org/sports/2021/2/10/eligibility-center.aspx'], ['NCAA Recruiting Calendars', 'https://www.ncaa.org/sports/2021/2/9/recruiting-calendars.aspx']],
    naia: [['NAIA Official Site', 'https://www.naia.org'], ['NAIA Eligibility Center', 'https://www.naia.org/eligibility-center/index']],
    njcaa: [['NJCAA Official Site', 'https://www.njcaa.org'], ['NJCAA Eligibility', 'https://www.njcaa.org/compliance/index']]
  };
  var COMMON_TABS = ['Overview', 'Sports', 'Finances', 'Roster & Scholarships', 'Compliance', 'Staff & Permissions', 'Calendar', 'Reports & Data', 'Billing', 'Settings'];
  var ncaaCal = 'Recruiting calendars define contact, evaluation, quiet and dead periods. Enter your own dates from the official calendar.';
  var list = [
    {
      id: 'd1', name: 'NCAA Division I', short: 'D1', body: 'NCAA', links: LINKS.ncaa, subs: ['FBS', 'FCS', 'Non-Football'],
      aid: 'equivalency', // equivalency and headcount sports both exist; the AD marks each sport's model
      tabs: { 'Finances': 'Finances & Revenue Share', 'Roster & Scholarships': 'Roster & Scholarships' },
      financeNote: 'Track scholarship utilization, equivalency vs headcount model per sport, and revenue-sharing / NIL items where they apply to your school.',
      limitFields: [['rs', 'Roster Size'], ['rl', 'Roster Limit'], ['sa', 'Aid Limit (Equivalencies Or Headcount)'], ['su', 'Aid Used'], ['ov', 'Official Visits Limit'], ['ovu', 'Official Visits Used']],
      rosterFields: ['Eligibility Years Left', 'Transfer Status', 'Academic Standing', 'APR / Academic Progress Notes'],
      eligLabel: 'NCAA Eligibility Center Registration', eligValues: ['Not Provided', 'Not Started', 'Registered', 'Certified', 'Unknown'],
      kpis: [['Scholarship Utilization', 'aidPct'], ['Roster Spots Left', 'rosterLeft'], ['Official Visits Used', 'visits']],
      sections: ['Contact / Evaluation / Quiet / Dead Period Reminders', 'Official Visit Tracking', 'Transfer Portal Windows', 'APR / Academic Tracking', 'Revenue Sharing / NIL (Where Applicable)', 'Title IX Snapshot'],
      calNote: ncaaCal, reminder: 'Division I recruiting contact, official visit and transfer-window rules apply. Confirm with your compliance office.'
    },
    {
      id: 'd2', name: 'NCAA Division II', short: 'D2', body: 'NCAA', links: LINKS.ncaa, subs: [],
      aid: 'partial',
      tabs: { 'Finances': 'Finances & Partial Scholarships' },
      financeNote: 'Division II programs typically award partial (equivalency) scholarships. Enter your own per-sport limits and amounts.',
      limitFields: [['rs', 'Roster Size'], ['rl', 'Roster Limit (If Any)'], ['sa', 'Equivalencies Available'], ['su', 'Equivalencies Used']],
      rosterFields: ['Eligibility Years Left', 'Transfer Status', 'Academic Standing', 'Partial Scholarship Amount'],
      eligLabel: 'NCAA Eligibility Center Registration', eligValues: ['Not Provided', 'Not Started', 'Registered', 'Certified', 'Unknown'],
      kpis: [['Equivalencies Used', 'aidUsed'], ['Roster Spots Left', 'rosterLeft'], ['Prospects On Board', 'board']],
      sections: ['Recruiting Calendar Reminders (Differs From Division I)', 'Partial Scholarship Tracking', 'Transfer Tracking', 'Academic Standing', 'Title IX Snapshot'],
      calNote: ncaaCal + ' Division II calendars and contact rules differ from Division I.', reminder: 'Division II calendar and contact rules differ from Division I. Confirm with your compliance office.'
    },
    {
      id: 'd3', name: 'NCAA Division III', short: 'D3', body: 'NCAA', links: LINKS.ncaa, subs: [],
      aid: 'none',
      tabs: { 'Finances': 'Recruiting Budget', 'Roster & Scholarships': 'Roster & Admissions Support' },
      hideTabs: [],
      financeNote: 'Division III does not award athletic scholarships. This view tracks the recruiting budget only; no scholarship equivalency or athletic aid fields are shown.',
      limitFields: [['rs', 'Roster Size'], ['rl', 'Roster Limit (If Any)']],
      rosterFields: ['Eligibility Years Left', 'Transfer Status', 'Academic Standing', 'Admissions Status', 'Financial Aid Package (Non-Athletic)'],
      eligLabel: 'Admissions / Academic Fit Status', eligValues: ['Not Provided', 'Not Started', 'Applied', 'Admitted', 'Enrolled', 'Unknown'],
      kpis: [['Admits', 'admitted'], ['Yield (Enrolled / Admitted)', 'yield'], ['Prospects On Board', 'board']],
      sections: ['Admissions Office Recruiting Support', 'Academic Fit Tracking', 'Financial Aid / Admissions-Based Support (Non-Athletic)', 'Recruiting Calendar Reminders', 'Title IX Snapshot'],
      calNote: ncaaCal, reminder: 'Division III does not offer athletic scholarships; admissions and academic fit drive recruiting. Confirm contact rules with your compliance office.'
    },
    {
      id: 'naia', name: 'NAIA', short: 'NAIA', body: 'NAIA', links: LINKS.naia, subs: [],
      aid: 'limits',
      tabs: { 'Finances': 'Finances & Scholarship Limits' },
      financeNote: 'Enter your own per-sport scholarship limits from NAIA rules. THE READ does not supply them.',
      limitFields: [['rs', 'Roster Size'], ['rl', 'Roster Limit (If Any)'], ['sa', 'Scholarship Limit (Per NAIA Rules)'], ['su', 'Scholarship Used']],
      rosterFields: ['Eligibility Years Left', 'Transfer Status (NAIA Transfer Rules)', 'Academic Standing'],
      eligLabel: 'NAIA Eligibility Center Status', eligValues: ['Not Provided', 'Not Started', 'Registered', 'Cleared', 'Unknown'],
      kpis: [['Scholarship Used', 'aidUsed'], ['Roster Spots Left', 'rosterLeft'], ['Prospects On Board', 'board']],
      sections: ['NAIA Calendar Reminders', 'NAIA Eligibility Center Tracking', 'Transfer Rules Tracking', 'Academic Eligibility Tracking'],
      calNote: 'NAIA publishes its own calendar and rules. Enter your own dates.', reminder: 'NAIA has its own eligibility center, academic eligibility and transfer rules. Confirm with the NAIA.'
    },
    {
      id: 'njcaa', name: 'NJCAA / JUCO', short: 'JUCO', body: 'NJCAA', links: LINKS.njcaa, subs: ['Division I', 'Division II', 'Division III'],
      aid: 'njcaa',
      tabs: { 'Finances': 'Finances & Aid', 'Roster & Scholarships': 'Roster & Transfers Out' },
      financeNote: 'NJCAA scholarship rules depend on the NJCAA division. Enter your own per-sport limits.',
      limitFields: [['rs', 'Roster Size'], ['rl', 'Roster Limit (If Any)'], ['sa', 'Aid Limit (Per NJCAA Division Rules)'], ['su', 'Aid Used'], ['tp', 'Transfers Placed To 4-Year Schools'], ['gr', 'Graduating / Transfer-Ready']],
      rosterFields: ['Eligibility Years Left (2-Year Model)', 'Transfer-Out Status', 'Commitment To 4-Year', 'Graduation / Transfer-Ready'],
      eligLabel: 'NJCAA Eligibility Status', eligValues: ['Not Provided', 'Not Started', 'Eligible', 'Ineligible', 'Unknown'],
      kpis: [['Transfers Placed', 'placed'], ['Graduating / Transfer-Ready', 'ready'], ['Roster Spots Left', 'rosterLeft']],
      sections: ['Transfer-Out Placement Tracking (Key Metric)', 'Letter Of Intent / Commitment To 4-Year', 'Graduation / Transfer-Ready Tracking', 'NJCAA Eligibility And Calendar Reminders'],
      calNote: 'NJCAA publishes its own rules and calendar. Enter your own dates.', reminder: 'JUCO athletes have a two-year eligibility model; placement to a 4-year school is the key outcome. Confirm NJCAA rules.'
    }
  ];
  var byId = {};
  list.forEach(function (d) { byId[d.id] = d; });
  // Old signup values map onto the new ids so earlier saved choices still work.
  var legacy = { 'NCAA D1': 'd1', 'NCAA D2': 'd2', 'NCAA D3': 'd3', 'NAIA': 'naia', 'Junior college (NJCAA / CCCAA)': 'njcaa' };
  var read = function () { var v = null; try { v = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { v = null; } return v && byId[v.id] ? v : null; };
  window.TheReadDivisions = {
    list: list, byId: byId, legacy: legacy, links: LINKS, commonTabs: COMMON_TABS,
    get: function (id) { return byId[id] || byId[legacy[id]] || null; },
    // Default is Division I until the school picks one; the department view says so.
    current: function () { var v = read(); return { div: byId[v ? v.id : 'd1'], sub: v ? v.sub || '' : '', chosen: !!v }; },
    set: function (id, sub) { var d = byId[id] || byId[legacy[id]]; if (!d) return false; try { localStorage.setItem(KEY, JSON.stringify({ id: d.id, sub: sub || '' })); return true; } catch (e) { return false; } }
  };
})();
