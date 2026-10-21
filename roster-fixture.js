/* FICTIONAL current college baseball roster for the Lineup and Depth Chart previews. Invented names, not real people, not recruits.
   Jersey numbers are unique. Positions are P, C, 1B, 2B, 3B, SS, OF only. Replace with a real roster import later (see docs/LINEUP_DEPTH_CHART_BACKEND_REQUIREMENTS.md). */
(function (root) {
  'use strict';
  var ROSTER = [
    { id: 'R-01', jersey: '3', name: 'Eli Brooks', pos: 'P', sec: '', grad: 2027, sport: 'Baseball' },
    { id: 'R-02', jersey: '11', name: 'Noah Carter', pos: 'P', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-03', jersey: '18', name: 'Owen Diaz', pos: 'P', sec: '', grad: 2026, sport: 'Baseball' },
    { id: 'R-04', jersey: '21', name: 'Liam Foster', pos: 'P', sec: '', grad: 2029, sport: 'Baseball' },
    { id: 'R-05', jersey: '27', name: 'Caleb Grant', pos: 'P', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-06', jersey: '2', name: 'Mason Hayes', pos: 'C', sec: '', grad: 2027, sport: 'Baseball' },
    { id: 'R-07', jersey: '34', name: 'Jack Irwin', pos: 'C', sec: '', grad: 2029, sport: 'Baseball' },
    { id: 'R-08', jersey: '9', name: 'Ben Jensen', pos: '1B', sec: '', grad: 2027, sport: 'Baseball' },
    { id: 'R-09', jersey: '44', name: 'Luke Kemp', pos: '1B', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-10', jersey: '4', name: 'Ryan Lopez', pos: '2B', sec: '', grad: 2026, sport: 'Baseball' },
    { id: 'R-11', jersey: '16', name: 'Cole Mercer', pos: '2B', sec: '', grad: 2029, sport: 'Baseball' },
    { id: 'R-12', jersey: '7', name: 'Evan Nash', pos: '3B', sec: '', grad: 2027, sport: 'Baseball' },
    { id: 'R-13', jersey: '23', name: 'Dylan Ortiz', pos: '3B', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-14', jersey: '1', name: 'Tyler Price', pos: 'SS', sec: '', grad: 2026, sport: 'Baseball' },
    { id: 'R-15', jersey: '12', name: 'Gabe Quinn', pos: 'SS', sec: '', grad: 2029, twoWay: false, sport: 'Baseball' },
    { id: 'R-16', jersey: '5', name: 'Max Reed', pos: 'OF', sec: '', grad: 2027, sport: 'Baseball' },
    { id: 'R-17', jersey: '8', name: 'Sam Stone', pos: 'OF', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-18', jersey: '15', name: 'Wes Tate', pos: 'OF', sec: '', grad: 2026, sport: 'Baseball' },
    { id: 'R-19', jersey: '19', name: 'Zach Underwood', pos: 'OF', sec: '', grad: 2029, sport: 'Baseball' },
    { id: 'R-20', jersey: '25', name: 'Nick Vance', pos: 'OF', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-21', jersey: '30', name: 'Cam Wells', pos: 'OF', sec: '', grad: 2027, sport: 'Baseball' },
    { id: 'R-22', jersey: '36', name: 'Ian Young', pos: 'P', sec: '', grad: 2029, sport: 'Baseball' },
    { id: 'R-23', jersey: '41', name: 'Drew Zane', pos: '1B', sec: '', grad: 2026, sport: 'Baseball' },
    { id: 'R-24', jersey: '6', name: 'Kyle Adams', pos: '2B', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-25', jersey: '10', name: 'Hunter Bell', pos: 'SS', sec: '', grad: 2027, sport: 'Baseball' },
    { id: 'R-26', jersey: '13', name: 'Trey Cole', pos: '3B', sec: '', grad: 2029, sport: 'Baseball' },
    { id: 'R-27', jersey: '22', name: 'Jon Doyle', pos: 'C', sec: '', grad: 2028, sport: 'Baseball' },
    { id: 'R-28', jersey: '28', name: 'Finn Ellis', pos: 'OF', sec: '', grad: 2026, sport: 'Baseball' }
  ];
  var api = { label: 'Fictional sample roster', players: function () { return ROSTER.map(function (p) { return Object.assign({}, p); }); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.TheReadRosterFixture = api;
})(typeof window !== 'undefined' ? window : this);
