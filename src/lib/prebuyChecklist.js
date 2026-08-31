const sections = {
  "Identity & Records": ["Registration and serial number match", "Airworthiness certificate present", "Complete logbook continuity", "AD/SB compliance documented"],
  "Airframe": ["Fuselage skin and structure", "Wing surfaces and attachment points", "Empennage and control surfaces", "Corrosion and previous repairs"],
  "Engine & Propeller": ["Leaks, hoses and mounts", "Compression and oil analysis records", "Propeller, spinner and governor", "Engine times and overhaul documents"],
  "Landing Gear": ["Tires, brakes and wheel assemblies", "Struts, actuators and doors", "Retraction test where applicable"],
  "Avionics & Electrical": ["Installed equipment matches records", "Functional avionics test", "Battery, alternator and wiring condition"],
  "Cabin & Exterior": ["Interior restraints and emergency equipment", "Windows, doors and seals", "Paint, lighting and cosmetic condition"],
  "Ground & Flight Test": ["Cold start and engine run", "Flight controls and systems", "Flight test discrepancies"]
};
export const DEFAULT_PREBUY_CHECKLIST = Object.entries(sections).flatMap(([category, labels]) => labels.map((label, index) => ({ id: `${category.toLowerCase().replace(/\W+/g, '-')}-${index}`, category, label, status: 'pending', notes: '', evidence_urls: [] })));
export const CHECKLIST_SECTIONS = Object.keys(sections);