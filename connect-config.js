/* Connect permission matrix: the ONE place that says who may start a conversation with whom.
   Demo only (localStorage). Each cell is a rule name used by connect.js:
   direct   - allowed
   deny     - never allowed
   intro    - not allowed directly; the sender can send a Request Introduction instead
   own      - guardian <-> the athlete they oversee
   mine     - verifier <-> athlete who requested that verifier (or whom the verifier is listed for)
   verifier - athlete -> a verifier the athlete asked to verify metrics
   interest - athlete -> a program the athlete added in Interests
   visible  - college coach -> athlete who allows coach messages (guardian-verified first for minors)
   If a conditional rule is not met, the sender gets the Request Introduction flow instead. */
(function () {
  var ROLES = {
    athlete: 'Athlete', guardian: 'Guardian', hs: 'High School Coach', pi: 'Private Instructor',
    vdp: 'Verified Data Provider', coach: 'College Coach', ad: 'Athletic Department'
  };
  var MATRIX = {
    athlete:  { athlete: 'deny', guardian: 'deny', hs: 'verifier', pi: 'verifier', vdp: 'verifier', coach: 'interest', ad: 'interest' },
    guardian: { athlete: 'own', guardian: 'deny', hs: 'intro', pi: 'intro', vdp: 'intro', coach: 'direct', ad: 'intro' },
    hs:       { athlete: 'mine', guardian: 'intro', hs: 'direct', pi: 'direct', vdp: 'direct', coach: 'direct', ad: 'intro' },
    pi:       { athlete: 'mine', guardian: 'intro', hs: 'direct', pi: 'direct', vdp: 'direct', coach: 'direct', ad: 'intro' },
    vdp:      { athlete: 'mine', guardian: 'intro', hs: 'direct', pi: 'direct', vdp: 'direct', coach: 'direct', ad: 'intro' },
    coach:    { athlete: 'visible', guardian: 'direct', hs: 'direct', pi: 'direct', vdp: 'direct', coach: 'direct', ad: 'direct' },
    ad:       { athlete: 'intro', guardian: 'intro', hs: 'intro', pi: 'intro', vdp: 'intro', coach: 'direct', ad: 'direct' }
  };
  var WHY = {
    deny: 'This role pairing cannot message each other.',
    intro: 'Direct messages are not allowed between these roles. Send a Request Introduction instead.',
    own: 'Guardians and the athlete they oversee can always message each other.',
    mine: 'Verifiers and athletes can message once the athlete has asked that verifier to verify metrics.',
    verifier: 'Athletes can message verifiers they asked to verify their metrics.',
    interest: 'Athletes can message programs they added to Interests.',
    visible: 'Coaches can message athletes who allow coach messages. Minors also need a verified guardian.'
  };
  window.CONNECT_CONFIG = {
    ROLES: ROLES, MATRIX: MATRIX, WHY: WHY,
    NCAA_NOTE: 'Reminder: college coach contact with recruits follows NCAA/NAIA/NJCAA contact and quiet/dead period rules. THE READ does not enforce them. Check your compliance office and the official calendars.',
    HONEST_NOTE: 'Demo only. Messages are saved in this browser, are not encrypted, and are not delivered to anyone. No emails or push notifications are sent.'
  };
})();
