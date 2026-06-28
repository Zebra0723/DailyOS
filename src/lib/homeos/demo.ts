import { fromNow, nowIso } from "./dates";
import { DEFAULT_SETTINGS, type HomeOSData } from "./types";

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${counter}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

const ts = () => nowIso();

/** Build a fresh, realistic UK demo dataset with dates relative to today. */
export function buildDemoData(): HomeOSData {
  const now = ts();

  const subscriptions: HomeOSData["subscriptions"] = [
    sub("Netflix", "Netflix", "Streaming", 10.99, 0, "Monthly", {
      renewalDate: fromNow(18),
      status: "Active",
      usageLevel: "Medium",
      importance: "Useful",
      owner: "Alex",
    }),
    sub("Disney+", "Disney", "Streaming", 7.99, 0, "Trial", {
      trialEndDate: fromNow(5),
      status: "Trial",
      usageLevel: "Low",
      importance: "Optional",
      owner: "Sam",
    }),
    sub("Amazon Prime", "Amazon", "Streaming", 8.99, 0, "Monthly", {
      renewalDate: fromNow(40),
      status: "Active",
      usageLevel: "High",
      importance: "Useful",
      owner: "Family",
    }),
    sub("Spotify Family", "Spotify", "Software", 19.99, 0, "Monthly", {
      renewalDate: fromNow(12),
      status: "Active",
      usageLevel: "High",
      importance: "Useful",
      owner: "Family",
    }),
    sub("iCloud Storage", "Apple", "Software", 2.99, 0, "Monthly", {
      renewalDate: fromNow(25),
      status: "Active",
      usageLevel: "High",
      importance: "Essential",
      owner: "Alex",
    }),
    sub("Broadband Plan", "BT", "Broadband", 39, 0, "Monthly", {
      renewalDate: fromNow(8),
      contractEndDate: fromNow(22),
      status: "Active",
      usageLevel: "High",
      importance: "Essential",
      owner: "Family",
    }),
    sub("Home Insurance", "Aviva", "Insurance", 0, 330, "Annual", {
      renewalDate: fromNow(26),
      status: "Active",
      usageLevel: "Unknown",
      importance: "Essential",
      owner: "Alex",
    }),
    sub("Ring Protect", "Ring", "Home Security", 4.99, 0, "Monthly", {
      renewalDate: fromNow(33),
      status: "Reviewing",
      usageLevel: "Low",
      importance: "Optional",
      owner: "Sam",
    }),
    sub("Mobile Phone Plan", "Vodafone", "Mobile", 22, 0, "Monthly", {
      renewalDate: fromNow(15),
      status: "Active",
      usageLevel: "High",
      importance: "Essential",
      owner: "Sam",
    }),
    sub("Family Learning App", "Twinkl", "Family", 6.99, 0, "Trial", {
      trialEndDate: fromNow(3),
      status: "Trial",
      usageLevel: "Low",
      importance: "Optional",
      owner: "Family",
    }),
    sub("Gym Membership", "PureGym", "Fitness", 49, 0, "Monthly", {
      renewalDate: fromNow(6),
      status: "Cancel Soon",
      usageLevel: "Low",
      importance: "Optional",
      owner: "Alex",
    }),
    sub("Microsoft 365", "Microsoft", "Software", 0, 79.99, "Annual", {
      renewalDate: fromNow(120),
      status: "Active",
      usageLevel: "Medium",
      importance: "Useful",
      owner: "Family",
      priceIncreaseDetected: true,
    }),
  ];

  const arrivals: HomeOSData["arrivals"] = [
    arr("Amazon package", "Package", {
      expectedDate: fromNow(0),
      company: "Amazon",
      trackingNumber: "TBA304928571",
      status: "Arriving Today",
      priority: "Normal",
    }),
    arr("Grocery delivery", "Grocery Delivery", {
      expectedDate: fromNow(1),
      expectedTimeWindow: "6–7pm",
      company: "Tesco",
      status: "Scheduled",
      priority: "Normal",
      needsSomeoneHome: true,
    }),
    arr("Sofa delivery", "Furniture Delivery", {
      expectedDate: fromNow(6),
      expectedTimeWindow: "8am–1pm",
      company: "DFS",
      status: "Scheduled",
      priority: "High",
      needsSomeoneHome: true,
      roomOrLocation: "Living Room",
    }),
    arr("Electrician visit", "Tradesperson", {
      expectedDate: fromNow(2),
      expectedTimeWindow: "9–12",
      company: "Bright Spark Electrical",
      contactName: "Dave",
      contactPhone: "07700 900123",
      status: "Scheduled",
      priority: "High",
      needsSomeoneHome: true,
      roomOrLocation: "Kitchen",
      accessInstructions: "Side gate code 1845",
    }),
    arr("Cleaner visit", "Cleaner", {
      expectedDate: fromNow(4),
      expectedTimeWindow: "10am",
      contactName: "Maria",
      status: "Scheduled",
      priority: "Normal",
      needsSomeoneHome: false,
      accessInstructions: "Key in lockbox, code 4421",
    }),
    arr("Guest staying over", "Guest", {
      expectedDate: fromNow(5),
      contactName: "Jordan",
      status: "Scheduled",
      priority: "Normal",
      needsSomeoneHome: true,
      notes: "Arriving evening, needs parking permit",
    }),
    arr("Rug collection", "Collection", {
      expectedDate: fromNow(3),
      company: "Evri",
      status: "Scheduled",
      priority: "Normal",
      needsSomeoneHome: true,
      notes: "Return collection for living room rug",
    }),
    arr("Router replacement", "Package", {
      expectedDate: fromNow(2),
      company: "BT",
      trackingNumber: "BT99182733",
      status: "In Transit",
      priority: "High",
    }),
    arr("Missed parcel", "Package", {
      expectedDate: fromNow(-1),
      company: "Royal Mail",
      status: "Missed",
      priority: "High",
      notes: "Card left, needs redelivery booking",
    }),
    arr("Wardrobe installer", "Installer", {
      expectedDate: fromNow(7),
      expectedTimeWindow: "1–4pm",
      company: "IKEA TaskRabbit",
      status: "Scheduled",
      priority: "Normal",
      needsSomeoneHome: true,
      roomOrLocation: "Main Bedroom",
    }),
  ];

  const roomItems: HomeOSData["roomItems"] = [
    room("Sofa", "Living Room", "Ordered", {
      itemType: "Sofa",
      brand: "DFS",
      retailer: "DFS",
      price: 899,
      orderDate: fromNow(-4),
      deliveryDate: fromNow(6),
      dimensions: "210 × 95 cm",
      colour: "Slate grey",
      priority: "High",
      assemblyRequired: false,
    }),
    room("Dining chairs", "Kitchen", "Comparing", {
      itemType: "Chairs",
      retailer: "Made.com",
      price: 240,
      priority: "Normal",
    }),
    room("Desk", "Office", "Need to Buy", {
      itemType: "Desk",
      priority: "Normal",
    }),
    room("Floor lamp", "Living Room", "Delivered", {
      itemType: "Lamp",
      brand: "John Lewis",
      retailer: "John Lewis",
      price: 65,
      deliveryDate: fromNow(-2),
      returnDeadline: fromNow(26),
      warrantyEndDate: fromNow(700),
      assemblyRequired: true,
      priority: "Low",
    }),
    room("Wardrobe", "Main Bedroom", "Assembling", {
      itemType: "Wardrobe",
      brand: "IKEA",
      retailer: "IKEA",
      price: 320,
      deliveryDate: fromNow(-3),
      assemblyRequired: true,
      installerNeeded: true,
      priority: "High",
    }),
    room("Rug", "Living Room", "Returning", {
      itemType: "Rug",
      retailer: "La Redoute",
      price: 120,
      orderDate: fromNow(-20),
      deliveryDate: fromNow(-12),
      returnDeadline: fromNow(3),
      priority: "High",
      notes: "Wrong colour, returning",
    }),
    room("Wall-mounted display shelf", "Bedroom", "Idea", {
      itemType: "Shelf",
      priority: "Low",
    }),
    room("Garden chair", "Garden", "Complete", {
      itemType: "Chair",
      retailer: "Argos",
      price: 45,
      priority: "Low",
    }),
    room("Bedside table", "Main Bedroom", "Installed", {
      itemType: "Table",
      brand: "Habitat",
      price: 79,
      warrantyEndDate: fromNow(400),
      priority: "Normal",
    }),
    room("Bookshelf", "Office", "Need to Buy", {
      itemType: "Shelf",
      priority: "Normal",
    }),
    room("Shoe rack", "Hallway", "Ordered", {
      itemType: "Storage",
      retailer: "Amazon",
      price: 32,
      deliveryDate: fromNow(1),
      assemblyRequired: true,
      priority: "Low",
    }),
    room("Bathroom mirror", "Bathroom", "Installed", {
      itemType: "Mirror",
      retailer: "Wayfair",
      price: 58,
      priority: "Low",
    }),
  ];

  const devices: HomeOSData["devices"] = [
    dev("Router", "Office", "Router", "Working", {
      brand: "BT",
      model: "Smart Hub 2",
      warrantyEndDate: fromNow(200),
      lastCheckedAt: fromNow(-10),
      maintenanceIntervalDays: 90,
    }),
    dev("Smart speaker", "Living Room", "Speaker", "Issue", {
      brand: "Amazon",
      model: "Echo Dot",
      issueDescription: "Keeps dropping off Wi-Fi",
      warrantyEndDate: fromNow(120),
    }),
    dev("Dishwasher", "Kitchen", "Appliance", "Working", {
      brand: "Bosch",
      warrantyEndDate: fromNow(20),
      lastCheckedAt: fromNow(-50),
      maintenanceIntervalDays: 120,
    }),
    dev("TV", "Living Room", "TV", "Working", {
      brand: "LG",
      model: "OLED55",
      warrantyEndDate: fromNow(300),
    }),
    dev("Kitchen light", "Kitchen", "Light", "Needs Repair", {
      issueDescription: "Flickers then cuts out",
    }),
    dev("Doorbell", "Hallway", "Security", "Needs Setup", {
      brand: "Ring",
    }),
    dev("Fridge", "Kitchen", "Appliance", "Working", {
      brand: "Samsung",
      warrantyEndDate: fromNow(500),
    }),
    dev("Game console", "Living Room", "Console", "Working", {
      brand: "Sony",
      model: "PS5",
    }),
    dev("Phone charger", "Main Bedroom", "Charger", "Issue", {
      issueDescription: "Only charges at certain angle",
    }),
    dev("Washing machine", "Utility Room", "Appliance", "Working", {
      brand: "Hotpoint",
      lastCheckedAt: fromNow(-200),
      maintenanceIntervalDays: 90,
      warrantyEndDate: fromNow(60),
    }),
    dev("Smart plug", "Living Room", "Plug", "Needs Setup", {
      brand: "TP-Link",
    }),
    dev("Heating thermostat", "Hallway", "Heating", "Working", {
      brand: "Hive",
      lastCheckedAt: fromNow(-15),
      maintenanceIntervalDays: 180,
    }),
  ];

  const documents: HomeOSData["documents"] = [
    doc("Sofa receipt", "Receipt", { provider: "DFS", date: fromNow(-4) }),
    doc("Broadband contract", "Contract", {
      provider: "BT",
      date: fromNow(-300),
      expiryDate: fromNow(22),
    }),
    doc("Dishwasher warranty", "Warranty", {
      provider: "Bosch",
      expiryDate: fromNow(20),
    }),
    doc("Home insurance policy", "Insurance", {
      provider: "Aviva",
      expiryDate: fromNow(26),
    }),
    doc("Electrician quote", "Quote", { provider: "Bright Spark Electrical" }),
    doc("Rug return label", "Return Label", { provider: "La Redoute" }),
    doc("Router manual", "Manual", { provider: "BT" }),
    doc("Wardrobe assembly manual", "Manual", { provider: "IKEA" }),
    doc("TV receipt", "Receipt", { provider: "Currys", date: fromNow(-120) }),
    doc("Washing machine manual", "Manual", { provider: "Hotpoint" }),
  ];

  return {
    homeProfile: {
      id: uid("home"),
      name: "Main Home",
      addressLabel: "London Home",
      householdMembers: ["Alex", "Sam", "Family"],
      createdAt: now,
      updatedAt: now,
    },
    subscriptions,
    arrivals,
    roomItems,
    devices,
    documents,
    alerts: [],
    todayActions: [],
    settings: DEFAULT_SETTINGS,
  };

  // ---- builders (kept local so demo stays self-contained) ------------------

  function sub(
    name: string,
    provider: string,
    category: HomeOSData["subscriptions"][number]["category"],
    monthlyCost: number,
    annualCost: number,
    billingCycle: HomeOSData["subscriptions"][number]["billingCycle"],
    extra: Partial<HomeOSData["subscriptions"][number]>,
  ): HomeOSData["subscriptions"][number] {
    return {
      id: uid("sub"),
      name,
      provider,
      category,
      monthlyCost,
      annualCost,
      billingCycle,
      status: "Active",
      tags: [],
      importance: "Unknown",
      usageLevel: "Unknown",
      priceIncreaseDetected: false,
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
  }

  function arr(
    title: string,
    type: HomeOSData["arrivals"][number]["type"],
    extra: Partial<HomeOSData["arrivals"][number]>,
  ): HomeOSData["arrivals"][number] {
    return {
      id: uid("arr"),
      title,
      type,
      status: "Scheduled",
      priority: "Normal",
      needsSomeoneHome: false,
      linkedEntityType: null,
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
  }

  function room(
    name: string,
    rm: HomeOSData["roomItems"][number]["room"],
    status: HomeOSData["roomItems"][number]["status"],
    extra: Partial<HomeOSData["roomItems"][number]>,
  ): HomeOSData["roomItems"][number] {
    return {
      id: uid("room"),
      name,
      room: rm,
      status,
      priority: "Normal",
      assemblyRequired: false,
      installerNeeded: false,
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
  }

  function dev(
    name: string,
    rm: HomeOSData["devices"][number]["room"],
    type: HomeOSData["devices"][number]["type"],
    status: HomeOSData["devices"][number]["status"],
    extra: Partial<HomeOSData["devices"][number]>,
  ): HomeOSData["devices"][number] {
    return {
      id: uid("dev"),
      name,
      room: rm,
      type,
      status,
      troubleshootingSteps: [],
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
  }

  function doc(
    title: string,
    type: HomeOSData["documents"][number]["type"],
    extra: Partial<HomeOSData["documents"][number]>,
  ): HomeOSData["documents"][number] {
    return {
      id: uid("doc"),
      title,
      type,
      linkedEntityType: null,
      tags: [],
      createdAt: now,
      updatedAt: now,
      ...extra,
    };
  }
}
