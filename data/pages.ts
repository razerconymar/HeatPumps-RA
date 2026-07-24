// ─────────────────────────────────────────────────────────────
// Heat Pump DST - Page graph
//
// Structure follows the DST Storyboard & Navigation doc exactly:
// alphanumeric page codes, landing page question links, and
// "What would you like to learn next?" navigation on every page.
// Content is drawn from the Individual DST Webpage Content doc.
// Where that doc reuses pages (e.g., 6B repackages 2C), links
// point to the original code per the storyboard's reuse rule.
//
// Body convention: plain paragraphs; lines starting with "## "
// render as subheadings; lines starting with "- " render as
// list items.
// ─────────────────────────────────────────────────────────────

export const CALC = "CALC"; // 8B/8C combined calculator
export const LANDING = "0A";
export const EXPLORE = "0A2"; // secondary landing ("progressing, not starting over")

export interface PageLink {
  label: string;
  target: string; // page code, CALC, or EXPLORE
}

export interface Page {
  code: string;
  title: string;
  body: string[];
  links: PageLink[];
  status: "drafted" | "stub";
}

export const pages: Record<string, Page> = {
  // ── 1A thread: money ──────────────────────────────────────

  "1A": {
    code: "1A",
    title: "Will a heat pump save me money?",
    status: "drafted",
    body: [
      "Many homeowners reduce their heating and cooling costs after installing a heat pump. Whether you will save money - and how much - depends on your current heating system, local energy prices, installation costs, and available incentives.",
      "For some homeowners, the financial case is straightforward. For others, it is more balanced. This section will help you understand which situation is more likely for your home.",
      "- If you currently heat with propane, savings are usually substantial",
      "- If you currently have an electric resistance furnace or baseboard heat, savings are usually substantial",
      "- If you currently have a gas furnace, it depends - monthly costs are often similar, and the higher upfront cost may not be recovered without rebates",
      "The upfront cost of a heat pump is often higher than replacing a furnace or air conditioner with similar equipment. Many homeowners recover some or all of that additional cost through lower energy bills over time, but the timing varies. To make an informed decision, you'll want to know the factors in the upfront cost, how your monthly bill will change, and whether rebates can reduce the overall cost.",
    ],
    links: [
      { label: "Will I be able to afford one today?", target: "1B" },
      { label: "Will my monthly energy bills change?", target: "1C" },
      { label: "When will I recover the higher upfront cost?", target: "1D" },
      { label: "Are there rebates or financing options?", target: "1E" },
      { label: "Estimate cost savings for my home", target: CALC },
      { label: "Find contractors", target: "FIND_CONTRACTORS" },
      { label: "Find rebates in my area", target: "FIND_REBATES" },
      { label: "I want more information", target: EXPLORE },
    ],
  },

  "1B": {
    code: "1B",
    title: "Will I be able to afford one today?",
    status: "drafted",
    body: [
      "The largest financial hurdle for many homeowners is the upfront cost of installing a heat pump. Fortunately, the amount you actually pay depends on several factors, and many homeowners qualify for rebates, tax credits, or financing that reduce the initial cost.",
      "## The heat pump itself",
      "Heat pumps vary in price by size, efficiency, and features. Most homeowners install an air-source heat pump, suitable for the vast majority of homes. Cold-climate air-source models are built for regions with weeks of below-freezing winters. Ground-source (geothermal) systems cost considerably more because they require underground piping - most homeowners will not need one.",
      "In Indiana, average installed heat pump costs are around $11,500, compared with roughly $4,000–$10,000 for gas furnaces and $3,000–$7,500 for central air conditioners. Replacing both a furnace and an AC with one heat pump changes that comparison meaningfully.",
      "## Installation",
      "Installing an air-source heat pump is as straightforward as installing an air conditioner - a licensed installer is required, but there is no extra complexity. Costs vary by contractor, home layout, and whether existing ductwork can be used, so getting more than one quote is worthwhile.",
      "## Electrical upgrades",
      "Some homes need a panel upgrade first - more common when replacing a gas furnace than electric heating. Heat pumps can run efficiently on a 100 or 150-amp panel, but capacity depends on your home's size and other connected appliances. Panels older than 20–30 years deserve a closer look. A contractor can determine whether your service is adequate.",
      "## Proper sizing",
      "The least expensive system is not always the best value, and a larger system is not necessarily better. Ask prospective contractors whether they will perform a Manual J load calculation. Installers sometimes oversize as insurance, which raises your cost and hurts comfort and humidity control.",
      "## Rebates and financing",
      "Federal tax credits, state programs, utility rebates, and financing can substantially reduce what you pay upfront. These programs change over time and vary by location, so check which apply before deciding.",
    ],
    links: [
      { label: "Will my monthly energy bills change?", target: "1C" },
      { label: "When will I recover the higher upfront cost?", target: "1D" },
      { label: "Estimate cost savings for my home", target: CALC },
      { label: "Find rebates in my area", target: "FIND_REBATES" },
      { label: "Find contractors", target: "FIND_CONTRACTORS" },
    ],
  },

  "1C": {
    code: "1C",
    title: "Will my monthly energy bills change?",
    status: "drafted",
    body: [
      "For many homeowners, lower monthly energy bills are the primary financial benefit of installing a heat pump. How much your bills change depends on the heating system you have today, local energy prices, and how much energy your home uses.",
      "## What you're replacing matters most",
      "- Electric resistance or baseboard heating: heat pumps use electricity far more efficiently, so homeowners often see substantial reductions",
      "- Propane: heat pumps often reduce annual heating costs considerably because they need much less energy",
      "- Natural gas: monthly costs are often similar, varying with local electricity and gas prices",
      "## Your home also matters",
      "Even the most efficient system must replace heat that escapes from your home. Energy use depends partly on insulation, air leakage, home size, thermostat settings, and local weather. Improving insulation and reducing drafts lowers bills regardless of which heating system you choose.",
      "## Energy prices change",
      "Electricity, natural gas, and propane prices all change over time, so future savings can't be predicted exactly. It is more useful to estimate a reasonable range based on current prices and your home's energy use.",
    ],
    links: [
      { label: "When will I recover the higher upfront cost?", target: "1D" },
      { label: "Estimate cost savings for my home", target: CALC },
      { label: "Find rebates in my area", target: "FIND_REBATES" },
    ],
  },

  "1D": {
    code: "1D",
    title: "When will I recover the higher upfront cost?",
    status: "drafted",
    body: [
      "For many homeowners the financial decision comes down to one question: will the lower energy bills eventually offset the higher installation cost? The answer depends on both the upfront cost and the amount you save each month.",
      "Because there are so many variables, the break-even range runs from as quick as 3 years (with rebates) to as long as 10 years (with no extra help and more modest savings). Heat pumps are expected to last at least 15 years, so any savings before year 15 is a net gain.",
      "## The most important factor is your current system",
      "- Electric resistance furnace: a heat pump uses far less electricity. Average break-even is around 4 years, with many variables",
      "- Propane heat: savings are often around $855 per year (Rewiring America). If your system is at replacement age, break-even comes much sooner than the 7–12 years for a newly installed one",
      "- Natural gas furnace: operating costs are comparable, so a system-to-system financial break-even is unlikely without rebates for heat pumps or energy efficiency",
      "An alternative to replacing a gas furnace outright is a dual-fuel system: cooling runs entirely on the heat pump, heating runs on the heat pump except in very cold weather, when the furnace takes over automatically.",
      "Rebates and tax credits can shorten the recovery time. Because every home is different, national averages are a starting point - use the calculator for your situation.",
    ],
    links: [
      { label: "Estimate cost savings for my home", target: CALC },
      { label: "Find rebates in my area", target: "FIND_REBATES" },
      { label: "Find contractors", target: "FIND_CONTRACTORS" },
      { label: "I want to learn more about heat pumps", target: EXPLORE },
    ],
  },

  "1E": {
    code: "1E",
    title: "Are there rebates or other financing options?",
    status: "drafted",
    body: [
      "Financing options for a heat pump, like any large appliance, vary by location. A customer should consider federal, state, county, city, utility, and installation rebates - several of these can stack.",
      "Indiana-specific rebate details are being compiled and validated for this page. Until then, the practical guidance stands: never evaluate a heat pump quote without checking which incentives apply. The net cost after incentives is often significantly lower than the sticker price.",
    ],
    links: [
      { label: "Estimate cost savings for my home", target: CALC },
      { label: "Find rebates in my area", target: "FIND_REBATES" },
      { label: "Find contractors", target: "FIND_CONTRACTORS" },
      { label: "I want to learn more about heat pumps", target: EXPLORE },
    ],
  },

  // ── 2A thread: how they work ──────────────────────────────

  "2A": {
    code: "2A",
    title: "How do heat pumps work?",
    status: "drafted",
    body: [
      "A heat pump is a heating and cooling system in one. It can replace your air conditioner, your furnace, or both.",
      "Unlike a furnace, a heat pump doesn't create heat by burning fuel. Instead, it moves heat from one place to another.",
      "During the summer, it works much like a standard air conditioner by moving heat from inside your home to the outdoors. During the winter, it reverses direction. Even when the outdoor air feels cold, it still contains heat - a heat pump captures that heat and moves it indoors to warm your home.",
      "Because it moves heat instead of creating it, a heat pump can heat and cool a home using much less energy than many conventional heating systems.",
    ],
    links: [
      { label: "Why are heat pumps so efficient?", target: "2B" },
      { label: "Why are people interested in heat pumps?", target: "2C" },
      { label: "Will a heat pump work where I live?", target: "2E" },
      { label: "How do I know if a heat pump would work for my home?", target: CALC },
      { label: "I want more information", target: EXPLORE },
    ],
  },

  "2B": {
    code: "2B",
    title: "Why are heat pumps so efficient?",
    status: "drafted",
    body: [
      "One of the main reasons homeowners consider heat pumps is that they can provide the same heating and cooling while using less energy. The reason is simple.",
      "A gas furnace creates heat by burning fuel. An electric resistance heater creates heat by passing electricity through heating elements. A heat pump works differently: it uses electricity to move heat that already exists instead of creating new heat.",
      "Because moving heat requires much less energy than creating it, a heat pump can often provide several units of heating for every unit of electricity it uses.",
      "That higher efficiency can lead to lower energy use, lower heating costs, and lower greenhouse gas emissions. How much those benefits matter depends on your home, your current heating system, and local energy prices.",
    ],
    links: [
      { label: "Why are people interested in heat pumps?", target: "2C" },
      { label: "What are the tradeoffs?", target: "2D" },
      { label: "Will a heat pump save me money?", target: "1A" },
    ],
  },

  "2C": {
    code: "2C",
    title: "Why are people interested in heat pumps?",
    status: "drafted",
    body: [
      "Homeowners choose heat pumps for different reasons. Some want lower energy bills, some want one system for both heating and cooling, and some want to reduce emissions or improve indoor air quality.",
      "## Saves money on monthly energy bills",
      "Many homeowners reduce their heating and cooling costs because heat pumps use energy very efficiently. Savings depend on what you're replacing and local energy prices.",
      "## Maintains home comfort",
      "Modern heat pumps are designed to maintain a steady indoor temperature. Many homeowners find they deliver more consistent comfort than systems that cycle on and off, though performance depends on sizing, installation, and insulation.",
      "## Can increase home value",
      "An energy-efficient system may make your home more attractive to some buyers, with effects varying by market and system quality.",
      "## Good for the planet",
      "Heat pumps can reduce greenhouse gas emissions through efficiency, with the biggest benefits when replacing fossil fuel heating - and the benefit grows as the grid gets cleaner.",
      "## Healthier indoor air, and safer",
      "Because heat pumps don't burn fuel inside the home, they avoid indoor combustion pollutants like nitrogen dioxide and carbon monoxide, and they eliminate gas-leak and venting risks associated with combustion heating.",
    ],
    links: [
      { label: "What are the tradeoffs?", target: "2D" },
      { label: "Will a heat pump work where I live?", target: "2E" },
      { label: "Will a heat pump save me money?", target: "1A" },
    ],
  },

  "2D": {
    code: "2D",
    title: "What are the tradeoffs?",
    status: "drafted",
    body: [
      "No single heating and cooling system is the best choice for every home. Heat pumps have important advantages, but they also involve tradeoffs worth understanding before deciding.",
      "- Upfront cost: heat pumps often cost more to install than replacing a furnace or AC with similar equipment",
      "- Financial savings vary: many homeowners save over time, but the amount depends on your current system, installation costs, and local prices. Natural gas is competitive on monthly costs and can be cheaper",
      "- Cold-weather performance: modern heat pumps perform well in cold climates when the right system is selected; some homes benefit from backup heat during the coldest weather",
      "- Installation quality matters: a properly sized and installed unit provides better comfort, efficiency, and humidity control than one too large or too small",
      "- Your home matters: insulation, air sealing, and ductwork influence how efficiently any heating system operates",
      "The goal isn't to determine whether heat pumps are \"good\" or \"bad.\" It's to understand whether a heat pump is a good fit for your home.",
    ],
    links: [
      { label: "Will a heat pump work where I live?", target: "2E" },
      { label: "Will a heat pump save me money?", target: "1A" },
      { label: "I've heard mixed things. What's actually true?", target: "4A" },
    ],
  },

  "2E": {
    code: "2E",
    title: "Will a heat pump work where I live?",
    status: "drafted",
    body: [
      "For many homeowners, the biggest practical question is whether a heat pump will provide enough heat during winter. For most homes, the answer is yes. The important question is choosing the right type of heat pump for your climate.",
      "## Standard air-source heat pumps",
      "These systems work well in many parts of the United States and continue providing heat at temperatures around 25°F (−4°C).",
      "## Cold-climate air-source heat pumps",
      "These models are designed for colder regions and can continue providing heat at temperatures around −13°F (−25°C).",
      "## Ground-source (geothermal) heat pumps",
      "These exchange heat with the ground, where temperatures stay relatively constant year-round, so they perform well even in very cold climates. They also cost considerably more to install.",
      "Many homeowners in colder climates choose either a cold-climate air-source heat pump or a dual-fuel system that uses a furnace only during the coldest weather.",
    ],
    links: [
      { label: "What are the tradeoffs?", target: "2D" },
      { label: "Will a heat pump save me money?", target: "1A" },
      { label: "I'm replacing my heating and cooling system", target: "3A" },
    ],
  },

  // ── 3A thread: urgent replacement ─────────────────────────

  "3A": {
    code: "3A",
    title: "My system is failing - I need a replacement now",
    status: "drafted",
    body: [
      "Replacing a furnace or air conditioner is rarely something homeowners plan for. When a system fails, there is often pressure to decide quickly.",
      "If you're replacing your heating or cooling system anyway, it can be a good opportunity to consider whether a heat pump is the right choice for your home. A heat pump can replace your furnace, your air conditioner, or both.",
      "Some homeowners install a heat pump together with a natural gas furnace in a dual-fuel system, where the heat pump provides most of the heating and cooling while the furnace operates only during very cold weather.",
      "The right choice depends on your home, your current heating system, your climate, and your budget. This section focuses on the questions homeowners most commonly face when replacing a system.",
    ],
    links: [
      { label: "Can a heat pump replace my current system?", target: "3B" },
      { label: "What should I ask a contractor?", target: "3C" },
      { label: "How do I know if it's a good financial decision?", target: "3D" },
    ],
  },

  "3B": {
    code: "3B",
    title: "Can a heat pump replace my current system?",
    status: "drafted",
    body: [
      "In many homes, yes. A heat pump can replace both a furnace and an air conditioner with a single system. Whether that's the best option depends on a few practical questions.",
      "## What equipment are you replacing?",
      "If both your furnace and AC are near the end of their useful lives, replacing both with one heat pump is worth serious consideration. If only one is failing, there are still good options, but the decision becomes more individualized.",
      "## What type of heating do you have now?",
      "Replacing propane or electric resistance heating often leads to larger operating savings. Replacing natural gas can still make sense, but the financial picture is usually more variable.",
      "## Does your climate require backup heat?",
      "Cold-climate air-source heat pumps now work effectively down to −13°F. A standard air-source unit works effectively down to 25°F - a big difference, since many households see weeks below that. Heat pumps can be paired with a gas furnace as backup; the changeover temperature is set in advance by the installer, so you don't have to manage anything.",
      "## Will your home need electrical upgrades?",
      "Some homes require a panel upgrade before installing a heat pump - more likely when switching from gas than from electric heat. A qualified contractor can determine whether your service has sufficient capacity.",
    ],
    links: [
      { label: "What should I ask a contractor?", target: "3C" },
      { label: "How do I know if it's a good financial decision?", target: "3D" },
      { label: "Will a heat pump work where I live?", target: "2E" },
    ],
  },

  "3C": {
    code: "3C",
    title: "What should I ask a contractor?",
    status: "drafted",
    body: [
      "Choosing a qualified contractor is just as important as choosing the right equipment. You don't need to become an HVAC expert, but a few questions reveal whether the recommendation is based on your home or on what the contractor usually installs.",
      "## How much experience do you have installing heat pumps?",
      "Not every contractor has extensive heat pump experience, and some had bad experiences with pre-2010 models that genuinely underperformed. Ask how often they install heat pumps and whether they've worked on homes like yours.",
      "## Will you perform a Manual J load calculation?",
      "A Manual J estimates how much heating and cooling your home actually needs. Too small struggles in extreme weather; too large costs more, cycles too frequently, and removes less humidity in summer. Installers may prefer oversizing as insurance - it's important to be aware in advance. The most thorough approach adds a blower door test and a Manual S sizing calculation.",
      "## Which type of heat pump do you recommend, and why?",
      "The recommendation should reflect your climate, your current system, and your home - not just the contractor's preferred equipment. If the explanation is simply \"this is what we always install,\" ask more questions.",
      "## Will I need an electrical panel upgrade?",
      "Electrical work increases installation costs, so understand whether your home needs upgrades before comparing quotes.",
      "## Can you explain why you selected this system?",
      "Why this size? Why this model? Why this backup heat, if any? You're not looking for a \"right\" answer - you're looking for reasoning that connects the recommendation to your home. Getting two or three estimates helps; if contractors recommend very different systems, the reasoning behind each is as informative as the price.",
    ],
    links: [
      { label: "How do I know if it's a good financial decision?", target: "3D" },
      { label: "Will a heat pump work where I live?", target: "2E" },
      { label: "Find contractors near me", target: "FIND_CONTRACTORS" },
    ],
  },

  "3D": {
    code: "3D",
    title: "How do I know if it's a good financial decision?",
    status: "drafted",
    body: [
      "If you're already replacing a furnace or air conditioner, this is the right time to compare all your options - not just replace your existing system with the same type of equipment. The financial decision balances higher upfront costs against future energy savings.",
      "## What are you replacing?",
      "- Electric resistance or baseboard heat: substantially lower monthly bills make the case relatively straightforward",
      "- Propane: often one of the more expensive heating fuels, so many homeowners reduce annual costs considerably",
      "- Natural gas: often less expensive and already relatively efficient, so the comparison is much closer - some homeowners save, others find monthly costs similar and decide financial savings alone aren't enough",
      "That doesn't make a heat pump a poor choice - it means homeowners may place greater value on other benefits like year-round comfort, indoor air quality, or lower emissions.",
      "## How long do you expect to stay in your home?",
      "Upfront costs are recovered gradually. More years in the home means more time to recover the investment.",
      "## Don't forget rebates and tax credits",
      "Federal credits, utility rebates, and state or local programs can substantially reduce upfront costs and shorten the recovery time.",
      "Use averages as a starting point, not your final answer - the calculator estimates installation costs, monthly operating costs, and time to recover the investment for your home.",
    ],
    links: [
      { label: "Estimate cost savings for my home", target: CALC },
      { label: "Find rebates in my area", target: "FIND_REBATES" },
      { label: "Learn more about how heat pumps work", target: "2A" },
    ],
  },

  // ── 4A thread: mixed things / myths ───────────────────────

  "4A": {
    code: "4A",
    title: "I've heard mixed things. What's actually true?",
    status: "drafted",
    body: [
      "If you've heard conflicting opinions about heat pumps, you're not alone. Some homeowners say they're one of the best home improvements they've made. Others say they don't work in cold weather, cost too much, or aren't worth the investment. The reality is more nuanced.",
      "Heat pumps have improved significantly over the past decade, and millions are now used across a wide range of climates. At the same time, they are not the best choice for every home or every homeowner.",
      "Whether a heat pump makes sense depends on what heating system you have today, where you live, how well your home retains heat, local energy prices, and what matters most to you.",
      "This section looks at the most common claims about heat pumps and explains what current evidence tells us - and where the answer depends on your situation.",
    ],
    links: [
      { label: "What should I know about affordability?", target: "4B" },
      { label: "Does a heat pump work in the cold?", target: "4C" },
      { label: "Does the air feel different with a heat pump?", target: "4D" },
      { label: "Is it better for my health and the planet?", target: "4E" },
      { label: "Is installation complicated? Will I need a bigger panel?", target: "4F" },
    ],
  },

  "4B": {
    code: "4B",
    title: "What should I know about affordability?",
    status: "drafted",
    body: [
      "One of the most common claims about heat pumps is that they always save money. The evidence is more nuanced.",
      "For many homeowners, heat pumps reduce monthly costs because they use energy very efficiently. But the amount depends on what you're replacing: electric resistance and propane replacements often see substantial savings, while natural gas comparisons are much closer because gas is relatively inexpensive in many areas.",
      "Heat pumps often cost more to install than similar-equipment replacements, though rebates, tax credits, and utility incentives can reduce those upfront costs. Compare total cost - installation, monthly bills, maintenance, incentives, and how long you expect to stay - not just today's price.",
      "## Why do people reach different conclusions?",
      "Two homeowners can honestly have different experiences. One replaces propane heating, receives rebates, and cuts bills substantially. Another replaces a newer gas furnace where gas is cheap and sees much smaller savings. Both experiences are true. Understanding what you're replacing is usually the best starting point.",
    ],
    links: [
      { label: "Does a heat pump work in the cold?", target: "4C" },
      { label: "Does the air feel different with a heat pump?", target: "4D" },
      { label: "Is it better for my health and the planet?", target: "4E" },
    ],
  },

  "4C": {
    code: "4C",
    title: "Does a heat pump work in the cold?",
    status: "drafted",
    body: [
      "Yes. The more useful question is how cold, and whether the heat pump is designed for your climate.",
      "Many standard air-source heat pumps continue providing heat around 25°F (−4°C). Cold-climate models are designed to keep operating around −13°F (−25°C). Every heat pump becomes less efficient as temperatures drop, so depending on your climate and model, your system may include backup heat for the coldest days.",
      "Proper sizing is critical, and so is your home itself: a drafty home loses heat quickly regardless of the heating system. For an extremely drafty home, sealing and insulating first is often the better investment before considering a heat pump.",
      "## Why do people still say they don't work?",
      "Earlier generations genuinely performed worse in cold weather. Some homeowners also compare standard units with cold-climate models without realizing they're designed for different conditions. And every heating system has limits - in very cold climates, some homes use a cold-climate unit or a dual-fuel system.",
      "Modern heat pumps work well in cold climates when the equipment is matched to the climate and the home.",
    ],
    links: [
      { label: "Does the air feel different with a heat pump?", target: "4D" },
      { label: "Is it better for my health and the planet?", target: "4E" },
      { label: "Is installation complicated?", target: "4F" },
    ],
  },

  "4D": {
    code: "4D",
    title: "Does the air feel different with a heat pump?",
    status: "drafted",
    body: [
      "Yes. This is one of the most common surprises homeowners mention after switching from a furnace.",
      "A gas furnace typically delivers very warm air for short periods. A heat pump usually delivers moderately warm air for longer periods - instead of bursts of heat, it maintains a more consistent indoor temperature. That slower, longer airflow is part of how it achieves its efficiency.",
      "Some homeowners initially think something is wrong because the air from the vents doesn't feel as hot. In most cases, that's simply how a heat pump is designed to operate.",
      "Many homeowners report that temperatures throughout the home become more consistent because the system runs longer at lower output. Others prefer the feeling of hotter furnace air. Neither experience is right or wrong - they reflect different heating approaches. A properly sized heat pump should keep your home comfortable, even though the experience feels different.",
    ],
    links: [
      { label: "Is it better for my health and the planet?", target: "4E" },
      { label: "Is installation complicated?", target: "4F" },
      { label: "Will a heat pump save me money?", target: "1A" },
    ],
  },

  "4E": {
    code: "4E",
    title: "Is it better for my health and the planet?",
    status: "drafted",
    body: [
      "The answer is yes - but it helps to separate different kinds of benefits.",
      "## Indoor air quality",
      "A heat pump does not burn fuel inside your home, so it doesn't produce combustion pollutants like carbon monoxide or nitrogen dioxide. Most furnaces operate safely when maintained, but eliminating indoor combustion eliminates those pollutants at the source. Indoor air quality also depends on ventilation, filtration, and humidity - a heat pump is one part of a healthy indoor environment, not the only one.",
      "## Home safety",
      "No natural gas or fuel for space heating means no carbon monoxide from furnace combustion, no gas leaks from heating equipment, and no combustion venting problems. Routine maintenance still matters, but the risks are different.",
      "## Environmental impact",
      "Heat pumps generally produce fewer greenhouse gas emissions because they use energy much more efficiently. How much lower depends on what you're replacing, where your electricity comes from, and how much energy your home uses. As the grid gets cleaner - the current trend - the same heat pump's emissions decline over time.",
      "Some people prioritize climate, others indoor air, others cost. All of those priorities are reasonable - the right decision depends on which benefits matter most to you.",
    ],
    links: [
      { label: "Is installation complicated?", target: "4F" },
      { label: "I want to reduce my home's environmental impact", target: "5A" },
    ],
  },

  "4F": {
    code: "4F",
    title: "Is installation complicated? Will I need a bigger electrical panel?",
    status: "drafted",
    body: [
      "Usually not - but sometimes. Installing a heat pump is similar in many ways to installing a central air conditioner. For homes that already have ductwork, much of the infrastructure may already be in place.",
      "## Will I need an electrical panel upgrade?",
      "Some homes need upgrades, especially if the existing service is older or near capacity; many don't require changes at all. Homes switching from gas heating are more likely to need additional capacity than homes already using electric heat. Knowing this before comparing quotes matters, because electrical work raises upfront costs.",
      "## What about ductwork?",
      "Many homes can use existing ductwork, but some older duct systems were designed for different airflow. If modifications are recommended, ask the contractor to explain why.",
      "## Does installation quality matter?",
      "Very much. Ask how contractors determine system size and whether they perform a Manual J calculation. Recommendations differ because contractors, homes, equipment, and priorities differ - if recommendations vary substantially, ask each contractor to explain their reasoning.",
      "For many homes, installation is straightforward. The key is a contractor who explains why the recommended system fits your home.",
    ],
    links: [
      { label: "I'm ready to compare costs", target: CALC },
      { label: "Find a qualified contractor", target: "FIND_CONTRACTORS" },
      { label: "I've heard mixed things - what else is true?", target: "4A" },
    ],
  },

  // ── 5A thread: environment ────────────────────────────────

  "5A": {
    code: "5A",
    title: "I want to reduce my home's environmental impact",
    status: "drafted",
    body: [
      "For many households, heating and cooling account for a large share of home energy use - and one of the largest contributors to a home's greenhouse gas emissions. If reducing your environmental impact is a priority, replacing your heating system can be one of the most meaningful decisions you make.",
      "Heat pumps can heat and cool homes using much less energy than many conventional systems, resulting in significant emissions reductions. But the benefits are not the same for every home. They depend on:",
      "- What you're replacing: propane, fuel oil, or electric resistance replacements reduce emissions more than replacing a high-efficiency gas furnace",
      "- Where you live: impact depends partly on how electricity is generated in your region",
      "- How much energy your home needs: well-insulated, air-sealed homes require less energy regardless of system",
      "- How well the system is designed and installed",
      "No heating system is environmentally impact-free. The important question is how impacts compare over the life of the system.",
    ],
    links: [
      { label: "How much can a heat pump reduce GHG emissions?", target: "5B" },
      { label: "What are the lifecycle emissions of a heat pump?", target: "5C" },
      { label: "What are the benefits beyond carbon?", target: "5D" },
    ],
  },

  "5B": {
    code: "5B",
    title: "How much can a heat pump reduce greenhouse gas emissions?",
    status: "drafted",
    body: [
      "The answer depends primarily on what heating system you're replacing. Replacing electric resistance, propane, or fuel oil produces larger reductions than replacing an efficient natural gas furnace - though replacing gas often still reduces emissions, just by a smaller amount.",
      "## Where you live matters",
      "Heat pumps use electricity, so their impact depends partly on how electricity is generated where you live. Lower-carbon grids mean larger reductions; fossil-heavy grids mean smaller ones.",
      "## Looking ahead",
      "If electricity becomes cleaner - the current trend - the same heat pump produces fewer emissions year after year without changing the equipment. But a heat pump cannot overcome a poorly insulated home: improving insulation and air sealing lowers emissions regardless of heating system.",
      "Different studies report different percentages because they examine different climates, grids, and systems - often they're answering slightly different questions rather than disagreeing.",
      "For many homes, replacing conventional heating with a heat pump is one of the larger opportunities to reduce household emissions.",
    ],
    links: [
      { label: "What are the lifecycle emissions of a heat pump?", target: "5C" },
      { label: "What are the benefits beyond carbon?", target: "5D" },
      { label: "Is a heat pump the best environmental investment for my home?", target: "5E" },
    ],
  },

  "5C": {
    code: "5C",
    title: "What are the lifecycle emissions of a heat pump?",
    status: "drafted",
    body: [
      "Electricity use only tells part of the story. Researchers examine the environmental impacts of the entire life of the equipment - from manufacturing through disposal.",
      "## Manufacturing",
      "Heat pumps use steel, aluminum, copper, plastics, electronics, and refrigerants, all with emissions and impacts that occur before installation. Every heating system has manufacturing impacts; the question is comparison, not existence.",
      "## Operating the system",
      "For most homes, operation over many years is the largest share of lifetime impact. Because heat pumps move heat instead of burning fuel, they use less energy and generate fewer operating emissions than conventional systems.",
      "## Refrigerants",
      "If refrigerant leaks, it contributes to greenhouse gas emissions. Modern equipment minimizes leaks, and manufacturers are introducing lower-global-warming-potential refrigerants - true of conventional cooling systems as well. Proper installation, maintenance, and refrigerant recovery at end of life further reduce these impacts.",
      "## End of life",
      "Many components can be recycled, and recovering refrigerants before disposal is especially important.",
      "Current research generally finds that, for most homes, reductions in operating emissions outweigh the impacts of manufacturing and refrigerants.",
    ],
    links: [
      { label: "What are the benefits beyond carbon?", target: "5D" },
      { label: "Is a heat pump the best environmental investment for my home?", target: "5E" },
      { label: "How do heat pumps fit into an all-electric home?", target: "5F" },
    ],
  },

  "5D": {
    code: "5D",
    title: "What are the environmental and health benefits beyond carbon?",
    status: "drafted",
    body: [
      "Greenhouse gas emissions get the most attention, but climate is only one part of the picture. Heat pumps also affect indoor air quality, home safety, outdoor air pollution, and dependence on fossil fuels.",
      "## Cleaner indoor air",
      "Heat pumps eliminate indoor combustion from space heating, avoiding pollutants like carbon monoxide and nitrogen dioxide. Indoor air quality also depends on ventilation, filtration, and humidity control - a heat pump is one part of a healthy indoor environment.",
      "## Cleaner outdoor air",
      "Burning fossil fuels contributes to outdoor air pollution linked to respiratory problems. Replacing on-site combustion with efficient electric heating reduces residential heating emissions, with the overall benefit depending partly on your region's electricity mix.",
      "## Reduced dependence on fossil fuels",
      "A heat pump provides space heating with electricity instead of on-site combustion. Even where the grid uses fossil fuels, a heat pump reduces demand on them by using less energy than alternative systems.",
      "Different homeowners value different outcomes - climate, indoor air, energy independence. Those priorities can all lead to the same technology, for different reasons.",
    ],
    links: [
      { label: "Is a heat pump the best environmental investment for my home?", target: "5E" },
      { label: "How do heat pumps fit into an all-electric home?", target: "5F" },
    ],
  },

  "5E": {
    code: "5E",
    title: "Is a heat pump the best environmental investment for my home?",
    status: "drafted",
    body: [
      "For many homes, a heat pump is one of the most effective ways to reduce emissions from heating and cooling. But it is not always the first improvement to consider.",
      "## Start with the home itself",
      "The cleanest energy is the energy you never need to use. Air sealing, insulation, and reducing drafts lower how much heating and cooling your home requires - improving comfort at the same time, regardless of heating system. A home that needs less heat may even allow a smaller, less expensive heat pump.",
      "## Think about your home as a system",
      "Many homeowners improve over time rather than all at once: insulation and air sealing, a heat pump, a heat pump water heater, rooftop solar, efficient appliances. These improvements complement one another.",
      "## Timing matters",
      "Replacing equipment before the end of its useful life is not always the best environmental or financial decision. Many homeowners install a heat pump when the existing furnace or AC is already due for replacement.",
      "A heat pump is often an excellent environmental investment - most effective as part of an overall strategy for your home's energy performance.",
    ],
    links: [
      { label: "How do heat pumps fit into an all-electric home?", target: "5F" },
      { label: "Will a heat pump save me money?", target: "1A" },
    ],
  },

  "5F": {
    code: "5F",
    title: "How do heat pumps fit into an all-electric home?",
    status: "drafted",
    body: [
      "Home electrification means replacing equipment that burns fuel on-site with efficient electric alternatives: heat pumps, heat pump water heaters, induction cooktops, electric vehicles, electric dryers.",
      "## Do I need to electrify everything at once?",
      "No. Many homeowners install a heat pump while continuing to use gas for cooking or water heating, or replace equipment gradually as it wears out. There is no single correct sequence - a gradual approach spreads costs over time while reducing waste.",
      "## What about rooftop solar and battery storage?",
      "Heat pumps and solar work well together because both use electricity, but solar is not required for a heat pump to provide benefits. Battery storage helps capture solar generation, and where the grid is fossil-heavy, it can further reduce grid-tied emissions.",
      "A heat pump can be one step toward an all-electric home - or simply an efficient replacement for aging equipment. Electrification and energy efficiency work best together.",
    ],
    links: [
      { label: "Will a heat pump save me money?", target: "1A" },
      { label: "I'm new to heat pumps", target: "6A" },
    ],
  },

  // ── 6A thread: beginners (reuses 2x pages per storyboard) ──

  "6A": {
    code: "6A",
    title: "I'm new to heat pumps - start with the basics",
    status: "drafted",
    body: [
      "A heat pump is an air conditioner and furnace in one. It looks just like an air conditioner that sits outside a building and is just as simple to install.",
      "It doesn't create heat by burning fuel - it moves heat that already exists in the air, both indoors and outdoors. That's why it uses far less energy than a gas furnace or electric resistance heater.",
    ],
    links: [
      { label: "What's in it for me?", target: "2C" },
      { label: "What does a heat pump do?", target: "2B" },
      { label: "What kind of heat pump should I get?", target: "2E" },
      { label: "What else do I need to know to get started?", target: "2D" },
    ],
  },

  // ── 7A: installer ─────────────────────────────────────────

  "7A": {
    code: "7A",
    title: "I'm an HVAC installer or contractor",
    status: "stub",
    body: [
      "Installer-facing content - spec resources, sizing best practices, and materials you can share with customers - is in development for a later phase.",
      "In the meantime, every customer-facing page in this tool is written to be shown directly to homeowners during a conversation. The contractor questions page reflects what informed customers will ask.",
    ],
    links: [
      { label: "What customers are told to ask contractors", target: "3C" },
      { label: "How this tool explains cold-weather performance", target: "2E" },
    ],
  },

  // ── Utility stubs ─────────────────────────────────────────

  FIND_CONTRACTORS: {
    code: "FIND_CONTRACTORS",
    title: "Find contractors",
    status: "stub",
    body: [
      "A contractor directory for your area is planned for a later phase of this tool.",
      "Until then, the strongest move you can make is knowing what to ask. The contractor questions guide prepares you to evaluate any quote with confidence.",
    ],
    links: [
      { label: "What should I ask a contractor?", target: "3C" },
      { label: "Back to exploring", target: EXPLORE },
    ],
  },

  FIND_REBATES: {
    code: "FIND_REBATES",
    title: "Find rebates in my area",
    status: "stub",
    body: [
      "A rebate lookup for Indiana utilities and federal programs is planned for a later phase, pending validation against current program terms (DSIRE, utility programs, federal tax credits).",
      "The practical guidance holds today: never evaluate a heat pump quote without checking which incentives apply. Ask each contractor which rebates the quoted equipment qualifies for and whether they handle the paperwork.",
    ],
    links: [
      { label: "Are there rebates or financing options?", target: "1E" },
      { label: "Back to exploring", target: EXPLORE },
    ],
  },
};

// ── Landing page (0A) - per storyboard, "How do heat pumps
//    work?" is the first button ──────────────────────────────

export const landingLinks: PageLink[] = [
  { label: "How do heat pumps work?", target: "2A" },
  { label: "Will a heat pump save me money?", target: "1A" },
  { label: "My system is failing - I need a replacement now", target: "3A" },
  { label: "I've heard mixed things. What's actually true?", target: "4A" },
  { label: "I want to reduce my carbon footprint", target: "5A" },
  { label: "I'm new to heat pumps - start with the basics", target: "6A" },
  { label: "I'm an HVAC installer/contractor", target: "7A" },
];

// ── Secondary landing (progress, don't restart) ─────────────

export const exploreLinks: PageLink[] = [
  { label: "How do I save money with a heat pump?", target: "1A" },
  { label: "Estimate cost savings for my home", target: CALC },
  { label: "When should I think about replacing my system?", target: "3A" },
  { label: "I'd like to understand how a heat pump works", target: "2A" },
  { label: "Will a heat pump work in cold weather?", target: "2E" },
  { label: "What are the downsides to getting a heat pump?", target: "2D" },
  { label: "I've heard heat pumps don't work that well - why?", target: "4C" },
  { label: "How is a heat pump more energy efficient?", target: "2B" },
  { label: "Are heat pumps good for people's health?", target: "4E" },
  { label: "Are heat pumps good for the planet?", target: "5B" },
];

// ── Persistent navigation (0B) ──────────────────────────────

export const persistentNav = [
  {
    heading: "Explore questions",
    links: [
      { label: "Save money", target: "1A" },
      { label: "Replace my system", target: "3A" },
      { label: "How heat pumps work", target: "2A" },
      { label: "I've heard mixed things", target: "4A" },
      { label: "Environmental impact", target: "5A" },
      { label: "Beginner's guide", target: "6A" },
    ],
  },
  {
    heading: "Decision tools",
    links: [
      { label: "Calculators", target: CALC },
      { label: "Find rebates", target: "FIND_REBATES" },
      { label: "Find contractors", target: "FIND_CONTRACTORS" },
    ],
  },
];

export function getPage(code: string): Page | undefined {
  return pages[code];
}


// ── Threads (for "where am I" progress hints) ───────────────

export const threads: Record<string, { name: string; order: string[] }> = {
  "1": { name: "Money path", order: ["1A", "1B", "1C", "1D", "1E"] },
  "2": { name: "How it works", order: ["2A", "2B", "2C", "2D", "2E"] },
  "3": { name: "Replacement path", order: ["3A", "3B", "3C", "3D"] },
  "4": { name: "Sorting fact from fiction", order: ["4A", "4B", "4C", "4D", "4E", "4F"] },
  "5": { name: "Environment path", order: ["5A", "5B", "5C", "5D", "5E", "5F"] },
};

export function threadInfo(code: string): { name: string; pos: number; total: number } | null {
  const t = threads[code[0]];
  if (!t) return null;
  const pos = t.order.indexOf(code);
  if (pos < 0) return null;
  return { name: t.name, pos: pos + 1, total: t.order.length };
}

// ── Search across all pages ─────────────────────────────────

export function searchPages(query: string): Page[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return Object.values(pages).filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.body.some((line) => line.toLowerCase().includes(q))
  );
}


// ── Reading time ─────────────────────────────────────────────

export function readingTime(page: Page): string {
  const words = page.body.join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `~${minutes} min read`;
}
