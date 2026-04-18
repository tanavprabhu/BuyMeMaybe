// Pools of fake handles and US cities used to make marketplace listings feel populated.
const HANDLES = [
  "@thriftgirliepop", "@dormroomdump", "@lukewarm.mia", "@kaitlynsellsrocks",
  "@nobonebroth", "@brynnposting", "@tinytowerz", "@moodyaudrey",
  "@jaelansdrawer", "@okayethan", "@maisieliquidates", "@finnparts.co",
  "@lowyieldlucas", "@sagebrushsadie", "@cambridgecarter", "@leosforsale",
  "@roomateregrets", "@noahnolongerneeds", "@cleoclearing", "@poppyposts",
];

const LOCATIONS = [
  "Brooklyn, NY", "Somerville, MA", "Austin, TX", "Echo Park, LA",
  "Providence, RI", "Oakland, CA", "Ann Arbor, MI", "Athens, GA",
  "Madison, WI", "Portland, ME", "Asheville, NC", "New Haven, CT",
  "Richmond, VA", "Boulder, CO", "Pittsburgh, PA", "Durham, NC",
  "Iowa City, IA", "Burlington, VT", "Providence, RI", "Philly, PA",
];

// Returns a random fake seller handle and US city for marketplace flavor.
export function randomSeller(): { name: string; location: string } {
  return {
    name: HANDLES[Math.floor(Math.random() * HANDLES.length)],
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
  };
}
