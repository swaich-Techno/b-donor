const RECIPIENT_COMPATIBLE_DONORS = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
};

const DONOR_CAN_DONATE_TO = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"]
};

function normalizeBloodGroup(group = "") {
  return String(group).trim().toUpperCase();
}

function getExactBloodGroup(group) {
  return normalizeBloodGroup(group);
}

function getCompatibleDonorGroups(recipientBloodGroup) {
  const normalized = normalizeBloodGroup(recipientBloodGroup);
  return RECIPIENT_COMPATIBLE_DONORS[normalized] || [];
}

function isCompatibleDonor(donorBloodGroup, recipientBloodGroup) {
  const donor = normalizeBloodGroup(donorBloodGroup);
  return getCompatibleDonorGroups(recipientBloodGroup).includes(donor);
}

function getPriorityMatchGroups(recipientGroup, urgency = "normal") {
  const exact = getExactBloodGroup(recipientGroup);
  const emergency = ["urgent", "critical"].includes(String(urgency).toLowerCase());
  if (!emergency) return { exactGroups: [exact], compatibleGroups: [] };

  return {
    exactGroups: [exact],
    compatibleGroups: getCompatibleDonorGroups(exact).filter((group) => group !== exact)
  };
}

module.exports = {
  DONOR_CAN_DONATE_TO,
  RECIPIENT_COMPATIBLE_DONORS,
  getExactBloodGroup,
  getCompatibleDonorGroups,
  getPriorityMatchGroups,
  isCompatibleDonor,
  normalizeBloodGroup
};
