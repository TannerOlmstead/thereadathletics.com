/* Connect permission matrix: the ONE place that says who may start a conversation with whom.
   Demo only (localStorage). Each cell is a rule name used by connect.js:
   direct   - allowed
   deny     - never allowed
   intro    - not allowed directly; the sender can send a Request Introduction instead
   own      - guardian <-> the athlete they oversee
   Guardians have NO account and are not a role here. Guardian consent is an attribute of a minor athlete (Verified / Pending / Declined / Revoked); a guardian reads the minor's conversations read-only through an emailed manage link.
   mine     - Verified Data Provider (any provider type) <-> athlete who requested that verifier (or whom the verifier is listed for)
   verifier - athlete -> a verifier the athlete asked to verify metrics
   interest - athlete -> a program the athlete added in Interests
   visible  - college coach -> athlete who allows coach messages (guardian-verified first for minors)
   If a conditional rule is not met, the sender gets the Request Introduction flow instead. */
(function () {
  var ROLES = { athlete: 'Athlete', vdp: 'Verified Data Provider', coach: 'College Coach', ad: 'Athletic Department' };
  var PTYPES = { hs: 'High School Coach', pi: 'Private Instructor / Trainer', sh: 'Showcase / Event Organizer', vdp: 'Other' };
  var MATRIX = {
    athlete: { athlete: 'deny', vdp: 'verifier', coach: 'interest', ad: 'interest' },
    vdp:     { athlete: 'mine', vdp: 'direct', coach: 'direct', ad: 'intro' },
    coach:   { athlete: 'visible', vdp: 'direct', coach: 'direct', ad: 'direct' },
    ad:      { athlete: 'intro', vdp: 'intro', coach: 'direct', ad: 'direct' }
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
    ROLES: ROLES, PTYPES: PTYPES, MATRIX: MATRIX, WHY: WHY,
    NCAA_NOTE: 'Reminder: college coach contact with recruits follows NCAA/NAIA/NJCAA contact and quiet/dead period rules. THE READ does not enforce them. Check your compliance office and the official calendars.',
    HONEST_NOTE: 'Demo only. Messages are saved in this browser, are not encrypted, and are not delivered to anyone. No emails or push notifications are sent.'
  };
})();
