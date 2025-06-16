
const defaultProfessions = [
  {
    profession: "Electrician",
    services: [
      "Fan Installation",
      "Tube Light/LED Installation",
      "Switch Board Repair",
      "Wiring Work",
      "Inverter Installation",
    ],
  },
  {
    profession: "Plumber",
    services: [
      "Tap Repair",
      "Water Pipe Leakage Fix",
      "Bathroom Fitting Installation",
      "Kitchen Sink Repair",
      "Water Tank Cleaning",
    ],
  },
  {
    profession: "Carpenter",
    services: [
      "Door Repair",
      "Furniture Assembly",
      "Window Installation",
      "Modular Kitchen Setup",
      "Wood Polishing",
    ],
  },
  {
    profession: "Welder",
    services: [
      "Grill Gate Repair",
      "Metal Frame Welding",
      "Window Grill Fabrication",
      "Steel Furniture Repair",
      "Iron Gate Installation",
    ],
  },
  {
    profession: "Mechanic",
    services: [
      "Bike Repair",
      "Car Repair",
      "Oil Change",
      "Battery Replacement",
      "Brake Inspection",
    ],
  },
  {
    profession: "HVAC Technician",
    services: [
      "AC Installation",
      "AC Gas Refilling",
      "AC Servicing",
      "Refrigerator Repair",
      "Cooling Issue Fix",
    ],
  },
  {
    profession: "Painter",
    services: [
      "Interior Painting",
      "Exterior Painting",
      "Wood Polish",
      "Wall Texturing",
      "Ceiling Design Painting",
    ],
  },
  {
    profession: "Mason",
    services: [
      "Wall Construction",
      "Cement Plastering",
      "Tile Laying",
      "Ceiling Work",
      "Renovation Jobs",
    ],
  },
  {
    profession: "Fitter",
    services: [
      "Pipe Fitting",
      "Window Fitting",
      "Door Hinge Setup",
      "Mechanical Assembly",
      "Machine Installation",
    ],
  },
  {
    profession: "Tailor / Seamstress",
    services: [
      "Custom Blouse Stitching",
      "Pant/Skirt Stitching",
      "Clothes Alteration",
      "Zip Replacement",
      "Patchwork Repair",
    ],
  },
  {
    profession: "House Cleaner",
    services: [
      "Bathroom Cleaning",
      "Kitchen Cleaning",
      "Sofa & Mattress Cleaning",
      "Full Home Deep Cleaning",
      "Mopping & Dusting",
    ],
  },
  {
    profession: "Sweeper / Janitor",
    services: [
      "Building Sweeping",
      "Staircase Cleaning",
      "Office Sweeping",
      "Toilet Cleaning",
      "Waste Management",
    ],
  },
  {
    profession: "Pest Control Worker",
    services: [
      "Termite Control",
      "Bed Bug Treatment",
      "Rodent Removal",
      "Ant & Cockroach Control",
      "Mosquito Spray",
    ],
  },
  {
    profession: "Gardener / Landscaper",
    services: [
      "Lawn Mowing",
      "Hedge Trimming",
      "Garden Cleanup",
      "Planting",
      "Manure and Fertilizing",
    ],
  },
  {
    profession: "Window Cleaner",
    services: [
      "Glass Window Cleaning",
      "Office Glass Panels",
      "Showroom Glass Wash",
      "Balcony Glass Polish",
      "Mirror Cleaning",
    ],
  },
  {
    profession: "Driver (Car / Taxi / Ola / Uber)",
    services: [
      "Daily Pickup/Drop",
      "Outstation Trips",
      "Hourly Driver",
      "Personal Driver",
      "Night Shift Driver",
    ],
  },
  {
    profession: "Truck Driver",
    services: [
      "Commercial Goods Transport",
      "Logistics Delivery",
      "Local Shifting",
      "Construction Material Delivery",
      "Freight Service",
    ],
  },
  {
    profession: "Delivery Boy",
    services: [
      "Food Delivery",
      "Grocery Delivery",
      "Medicine Pickup",
      "Document Delivery",
      "Custom Parcel Delivery",
    ],
  },
  {
    profession: "Courier Service Agent",
    services: [
      "Parcel Pickup",
      "COD Courier",
      "Urgent Delivery",
      "Outstation Courier",
      "Logistics Support",
    ],
  },
  {
    profession: "Auto Rickshaw Driver",
    services: [
      "Local Transport",
      "Parcel Transport",
      "Daily Pickup/Drop",
      "Event Shuttle",
      "Night Shift Ride",
    ],
  },
  {
    profession: "Construction Laborer",
    services: [
      "Mixing Cement",
      "Lifting Material",
      "Digging",
      "Scaffolding Support",
      "Wall Breaking",
    ],
  },
  {
    profession: "Site Supervisor (Non-technical)",
    services: [
      "Labor Management",
      "Material Tracking",
      "Site Inspection",
      "Daily Reporting",
      "On-site Safety Monitoring",
    ],
  },
  {
    profession: "Roofer",
    services: [
      "New Roof Installation",
      "Roof Leakage Repair",
      "Waterproofing",
      "Tile Roof Setup",
      "Gutter Cleaning",
    ],
  },
  {
    profession: "Plasterer",
    services: [
      "Wall Plastering",
      "Ceiling Finishing",
      "Pop Work",
      "Crack Repair",
      "Cement Plaster Removal",
    ],
  },
  {
    profession: "Scaffolder",
    services: [
      "Scaffold Setup",
      "Support Frame Setup",
      "Site Scaffolding",
      "Scaffold Dismantling",
      "Safety Check",
    ],
  },
  {
    profession: "Cook / Chef (Home / Hotel)",
    services: [
      "Daily Meal Cooking",
      "Event Cooking",
      "Home Party Catering",
      "Custom Meal Plan",
      "Tiffin Prep",
    ],
  },
  {
    profession: "Waiter / Steward",
    services: [
      "Event Service",
      "Table Serving",
      "Buffet Management",
      "Dish Setup",
      "Cleaning Tables",
    ],
  },
  {
    profession: "Dishwasher",
    services: [
      "Utensil Washing",
      "Commercial Dish Cleaning",
      "Event Dishwashing",
      "Kitchen Helper",
      "Hygiene Maintenance",
    ],
  },
  {
    profession: "Bartender",
    services: [
      "Cocktail Making",
      "Mocktail Setup",
      "Bar Setup for Events",
      "Drinks Serving",
      "Glass Cleaning",
    ],
  },
  {
    profession: "Butcher",
    services: [
      "Meat Cutting",
      "Fish Cleaning",
      "Custom Orders",
      "Packing Meat",
      "Home Delivery",
    ],
  },
  {
    profession: "Security Guard",
    services: [
      "Society Security",
      "Mall Guard",
      "Warehouse Watch",
      "Night Security",
      "CCTV Monitoring",
    ],
  },
  {
    profession: "Watchman / Gatekeeper",
    services: [
      "Gate Monitoring",
      "Visitor Entry",
      "Night Duty",
      "Building Guard",
      "Access Control",
    ],
  },
  {
    profession: "Bouncer",
    services: [
      "Event Security",
      "Club Guard",
      "Crowd Control",
      "VIP Escort",
      "Entry Check",
    ],
  },
  {
    profession: "Lift Operator",
    services: [
      "Lift Operation",
      "Building Support",
      "Maintenance Reporting",
      "Visitor Help",
      "Elderly Assistance",
    ],
  },
  {
    profession: "Fire Safety Attendant",
    services: [
      "Fire Drill Setup",
      "Fire Extinguisher Monitoring",
      "Evacuation Training",
      "Fire Safety Reporting",
      "Safety Equipment Handling",
    ],
  },
  {
    profession: "Barber / Hairdresser",
    services: [
      "Haircut",
      "Beard Trim",
      "Facial",
      "Hair Wash",
      "Hair Color",
    ],
  },
  {
    profession: "AC Repair Technician",
    services: [
      "No Cooling Fix",
      "Gas Leak Repair",
      "Water Leak Fix",
      "AC Servicing",
      "Remote Replacement",
    ],
  },
  {
    profession: "Mobile Repair Technician",
    services: [
      "Screen Replacement",
      "Battery Change",
      "Charging Port Fix",
      "Software Issues",
      "Camera Fix",
    ],
  },
  {
    profession: "Washerman / Laundry Worker",
    services: [
      "Cloth Washing",
      "Ironing",
      "Dry Cleaning",
      "Stain Removal",
      "Pickup & Delivery",
    ],
  },
  {
    profession: "Ironing / Pressing Services",
    services: [
      "Shirt Ironing",
      "Saree Pressing",
      "Curtain Ironing",
      "Uniform Pressing",
      "Home Pickup",
    ],
  },
  {
    profession: "Packers & Movers",
    services: [
      "Home Shifting",
      "Office Relocation",
      "Packing Materials",
      "Loading/Unloading",
      "Furniture Setup",
    ],
  },
  {
    profession: "Nanny / Babysitter",
    services: [
      "Infant Care",
      "Diaper Changing",
      "Feeding Support",
      "Sleep Monitoring",
      "Playtime Activity",
    ],
  },
  {
    profession: "Elderly Care Worker",
    services: [
      "Daily Routine Help",
      "Medicine Reminder",
      "Mobility Assistance",
      "Companionship",
      "Food Preparation",
    ],
  },
  {
    profession: "Pet Care / Pet Groomer",
    services: [
      "Dog Walking",
      "Hair Trimming",
      "Nail Clipping",
      "Bathing",
      "Feeding Support",
    ],
  },
  {
    profession: "Event Helper / Tent Setup Worker",
    services: [
      "Tent Setup",
      "Chair/Table Arrangement",
      "Stage Setup",
      "Decoration Assistance",
      "Cleaning After Event",
    ],
  },
];


module.exports = defaultProfessions;




