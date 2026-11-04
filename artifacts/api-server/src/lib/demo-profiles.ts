/** Fixed prototype personas; not a company directory or production sign-in. */
export const DEMO_PROFILES = [
  { id: "m1", name: "Alex Morgan", employeeId: "M001", area: "Shipping", role: "Manager", jobLevel: "Manager", editor: true },
  { id: "m2", name: "Jordan Lee", employeeId: "M002", area: "Receiving", role: "Employee", jobLevel: "Lead", editor: false },
  { id: "e2", name: "Taylor Brooks", employeeId: "WH1058", area: "Picking", role: "Employee", jobLevel: "Supervisor", editor: false },
  { id: "e1", name: "Sam Rivera", employeeId: "WH1042", area: "Packing", role: "Employee", jobLevel: "Frontline Employee", editor: false },
];
export const DEMO_PROFILE_IDS = DEMO_PROFILES.map(profile => profile.id);
