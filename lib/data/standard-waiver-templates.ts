/**
 * Standard Waiver Templates
 *
 * Pre-written waiver templates that captains can use as starting points
 * when creating new waiver templates. These are NOT automatically created
 * in any captain's account — they are purely available in the "New Template"
 * flow for captains to select, customize, and save as their own.
 *
 * IMPORTANT: These templates are provided as reasonable starting points only.
 * Captains should have their own legal counsel review any waiver before use.
 * DockSlot does not provide legal advice and these templates do not constitute
 * legal documents until reviewed and approved by a licensed attorney.
 */

export interface StandardWaiverTemplate {
  key: string;
  title: string;
  description: string;
  category: 'general' | 'fishing' | 'cruise' | 'minor';
  content: string;
}

export const STANDARD_WAIVER_TEMPLATES: StandardWaiverTemplate[] = [
  // =========================================================================
  // 1. General Charter Liability Waiver
  // =========================================================================
  {
    key: 'general-charter-liability',
    title: 'General Charter Liability Waiver',
    description:
      'A broad liability waiver suitable for any type of boat charter — fishing, sunset cruises, sightseeing, party boats, and more.',
    category: 'general',
    content: `# CHARTER BOAT TRIP LIABILITY WAIVER AND RELEASE OF CLAIMS

**Vessel:** {{vessel_name}}
**Captain/Operator:** {{captain_name}}
**Trip Type:** {{trip_type}}
**Trip Date:** {{trip_date}}
**Passenger Name:** {{passenger_name}}
**Date Signed:** {{current_date}}

---

## 1. Assumption of Risk

I, **{{passenger_name}}**, acknowledge that I am voluntarily participating in a charter boat trip aboard the vessel **{{vessel_name}}**, operated by **{{captain_name}}**. I understand that maritime and boating activities involve **inherent risks** that cannot be eliminated regardless of the care taken by the captain and crew.

These inherent risks include, but are not limited to:

- Changing weather and sea conditions, including rough seas, high winds, lightning, and sudden storms
- Vessel motion, rocking, and wave impacts that may cause loss of balance or falls
- Slippery deck surfaces due to water, spray, or marine conditions
- Sun exposure, heat-related illness, dehydration, and sunburn
- Seasickness and motion sickness
- Exposure to marine wildlife, including but not limited to jellyfish, stinging creatures, and other animals
- Risks associated with boarding, disembarking, and moving about the vessel
- The remote nature of offshore activities and distance from emergency medical facilities
- Equipment malfunction or failure despite proper maintenance
- Actions or negligence of other passengers or third parties

I **freely accept and assume all such risks**, both known and unknown, and accept personal responsibility for any injury, disability, death, or property loss or damage resulting from such risks.

## 2. Release of Liability

In consideration of being permitted to participate in this charter trip, I hereby **release, waive, discharge, and covenant not to sue** {{captain_name}}, the vessel owner(s), crew members, and their respective officers, agents, employees, representatives, successors, and assigns (collectively, the "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or relating to any loss, damage, or injury, including death, that may be sustained by me or my property while participating in this charter trip, **to the fullest extent permitted by law**.

This release applies regardless of whether such loss, damage, or injury is caused by the **negligence** of the Released Parties or otherwise.

## 3. Medical Fitness

I represent that I am physically and mentally fit to participate in this charter boat trip. I acknowledge that it is my responsibility to inform the captain of any medical conditions, allergies, disabilities, or limitations that may affect my safety or the safety of others aboard.

I understand that the captain reserves the right to refuse or limit my participation if, in the captain's sole judgment, my condition may pose a risk to myself or others.

## 4. Safety Instructions and Vessel Rules

I agree to:

- Listen to and follow all safety briefings, instructions, and directions given by the captain and crew
- Wear a life jacket or personal flotation device (PFD) when instructed to do so
- Refrain from any behavior that could endanger myself, other passengers, or the crew
- Not board the vessel while impaired by alcohol or drugs
- Remain seated or hold on to secure points when the vessel is in motion, as directed by the captain

I understand that the captain has **final authority** over all matters of safety aboard the vessel and may terminate the trip at any time if safety conditions warrant.

## 5. Coast Guard and Safety Equipment

I acknowledge that the vessel is equipped with U.S. Coast Guard-required safety equipment, including life jackets, fire extinguisher(s), and visual distress signals. I understand that the location of this safety equipment has been or will be pointed out to me during the safety briefing.

## 6. Photo and Video Release

I grant {{captain_name}} and their representatives permission to take photographs and/or video recordings of me during the charter trip and to use such images for promotional, marketing, or social media purposes without further consent or compensation. I understand I may opt out of this by notifying the captain before departure.

## 7. Governing Law and Severability

This waiver shall be governed by applicable federal maritime law and the laws of the state in which the trip departs. If any provision of this waiver is found to be unenforceable, the remaining provisions shall remain in full force and effect.

## 8. Acknowledgment

**I have read this waiver and release of liability, fully understand its terms, and understand that I am giving up substantial rights, including my right to sue. I sign this agreement freely and voluntarily without any inducement.**`,
  },

  // =========================================================================
  // 2. Fishing Charter Waiver
  // =========================================================================
  {
    key: 'fishing-charter-waiver',
    title: 'Fishing Charter Waiver',
    description:
      'Specific to fishing trips — includes general boating risks plus fishing-specific hazards like hooks, tackle, fish handling, and equipment.',
    category: 'fishing',
    content: `# FISHING CHARTER LIABILITY WAIVER AND RELEASE OF CLAIMS

**Vessel:** {{vessel_name}}
**Captain/Operator:** {{captain_name}}
**Trip Type:** {{trip_type}}
**Trip Date:** {{trip_date}}
**Passenger Name:** {{passenger_name}}
**Date Signed:** {{current_date}}

---

## 1. Assumption of Risk

I, **{{passenger_name}}**, acknowledge that I am voluntarily participating in a fishing charter trip aboard the vessel **{{vessel_name}}**, operated by **{{captain_name}}**. I understand that fishing and maritime activities involve **inherent risks** that cannot be eliminated regardless of the care taken by the captain and crew.

These inherent risks include, but are not limited to:

- Changing weather and sea conditions, including rough seas, high winds, lightning, and sudden storms
- Vessel motion, rocking, and wave impacts that may cause loss of balance or falls
- Slippery deck surfaces due to water, fish, bait, spray, or marine conditions
- Sun exposure, heat-related illness, dehydration, and sunburn
- Seasickness and motion sickness
- Exposure to marine wildlife, including but not limited to jellyfish, stinging creatures, sharks, and other animals
- The remote nature of offshore activities and distance from emergency medical facilities
- Equipment malfunction or failure despite proper maintenance
- Actions or negligence of other passengers or third parties

### Fishing-Specific Risks

In addition to general boating risks, I acknowledge the following risks specific to fishing activities:

- **Hooks and tackle:** Risk of puncture wounds, cuts, or eye injuries from fishing hooks, lures, weights, and other tackle, whether from my own equipment or that of other passengers
- **Rods, reels, and line:** Risk of injury from sudden rod movements, recoiling fishing line, tangled lines, or equipment under tension
- **Fighting fish:** Risk of strain, falls, or impact injuries while fighting or landing fish, including being pulled off balance by a fish on the line
- **Fish handling:** Risk of cuts, punctures, or stings from fish spines, fins, teeth, or gill plates when handling caught fish
- **Bait preparation:** Risk of cuts or injury from handling bait, knives, and cutting tools
- **Fish cleaning areas:** Risk of slips, cuts, and exposure to sharp instruments in fish cleaning areas

I **freely accept and assume all such risks**, both known and unknown, and accept personal responsibility for any injury, disability, death, or property loss or damage resulting from such risks.

## 2. Release of Liability

In consideration of being permitted to participate in this fishing charter trip, I hereby **release, waive, discharge, and covenant not to sue** {{captain_name}}, the vessel owner(s), crew members, and their respective officers, agents, employees, representatives, successors, and assigns (collectively, the "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or relating to any loss, damage, or injury, including death, that may be sustained by me or my property while participating in this charter trip, **to the fullest extent permitted by law**.

This release applies regardless of whether such loss, damage, or injury is caused by the **negligence** of the Released Parties or otherwise.

## 3. Medical Fitness

I represent that I am physically and mentally fit to participate in this fishing charter trip. I acknowledge that it is my responsibility to inform the captain of any medical conditions, allergies, disabilities, or limitations that may affect my safety or the safety of others aboard.

I understand that the captain reserves the right to refuse or limit my participation if, in the captain's sole judgment, my condition may pose a risk to myself or others.

## 4. Safety Instructions and Vessel Rules

I agree to:

- Listen to and follow all safety briefings, instructions, and directions given by the captain and crew
- Wear a life jacket or personal flotation device (PFD) when instructed to do so
- Handle all fishing equipment with care and as directed by the captain and crew
- Refrain from any behavior that could endanger myself, other passengers, or the crew
- Not board the vessel while impaired by alcohol or drugs
- Remain seated or hold on to secure points when the vessel is in motion, as directed by the captain

I understand that the captain has **final authority** over all matters of safety aboard the vessel and may terminate the trip at any time if safety conditions warrant.

## 5. Catch-and-Release and Fishing Regulations

I acknowledge that:

- The captain may enforce catch-and-release policies at their discretion or as required by local, state, or federal fishing regulations
- All fishing activities are subject to applicable fishing laws and regulations, including bag limits, size limits, and seasonal restrictions
- The captain will make reasonable efforts to ensure compliance with fishing regulations, and I agree to cooperate with all such efforts
- There is **no guarantee of catching fish**, and the captain is not responsible for the quantity or quality of the catch

## 6. Equipment Responsibility

I understand that fishing equipment may be provided for my use during the charter. I agree to:

- Use all equipment responsibly and as instructed by the captain and crew
- Report any equipment damage or malfunction immediately
- Accept financial responsibility for any equipment that is **intentionally damaged, lost overboard due to negligence, or misused** beyond normal wear and tear

## 7. Coast Guard and Safety Equipment

I acknowledge that the vessel is equipped with U.S. Coast Guard-required safety equipment, including life jackets, fire extinguisher(s), and visual distress signals. I understand that the location of this safety equipment has been or will be pointed out to me during the safety briefing.

## 8. Photo and Video Release

I grant {{captain_name}} and their representatives permission to take photographs and/or video recordings of me during the charter trip and to use such images for promotional, marketing, or social media purposes without further consent or compensation. I understand I may opt out of this by notifying the captain before departure.

## 9. Governing Law and Severability

This waiver shall be governed by applicable federal maritime law and the laws of the state in which the trip departs. If any provision of this waiver is found to be unenforceable, the remaining provisions shall remain in full force and effect.

## 10. Acknowledgment

**I have read this waiver and release of liability, fully understand its terms, and understand that I am giving up substantial rights, including my right to sue. I sign this agreement freely and voluntarily without any inducement.**`,
  },

  // =========================================================================
  // 3. Sunset/Sightseeing Cruise Waiver
  // =========================================================================
  {
    key: 'sunset-sightseeing-cruise-waiver',
    title: 'Sunset/Sightseeing Cruise Waiver',
    description:
      'For non-fishing leisure cruises — includes general boating risks plus alcohol acknowledgment, boarding safety, and personal property responsibility.',
    category: 'cruise',
    content: `# CRUISE/SIGHTSEEING TRIP LIABILITY WAIVER AND RELEASE OF CLAIMS

**Vessel:** {{vessel_name}}
**Captain/Operator:** {{captain_name}}
**Trip Type:** {{trip_type}}
**Trip Date:** {{trip_date}}
**Passenger Name:** {{passenger_name}}
**Date Signed:** {{current_date}}

---

## 1. Assumption of Risk

I, **{{passenger_name}}**, acknowledge that I am voluntarily participating in a cruise/sightseeing trip aboard the vessel **{{vessel_name}}**, operated by **{{captain_name}}**. I understand that maritime and boating activities involve **inherent risks** that cannot be eliminated regardless of the care taken by the captain and crew.

These inherent risks include, but are not limited to:

- Changing weather and sea conditions, including rough seas, high winds, lightning, and sudden storms
- Vessel motion, rocking, and wave impacts that may cause loss of balance or falls
- Slippery deck surfaces due to water, spray, or marine conditions
- Sun exposure, heat-related illness, dehydration, and sunburn
- Seasickness and motion sickness
- Exposure to marine wildlife, including but not limited to jellyfish, stinging creatures, and other animals
- Risks associated with boarding, disembarking, and moving about the vessel
- The remote nature of offshore or coastal activities and distance from emergency medical facilities
- Equipment malfunction or failure despite proper maintenance
- Actions or negligence of other passengers or third parties

I **freely accept and assume all such risks**, both known and unknown, and accept personal responsibility for any injury, disability, death, or property loss or damage resulting from such risks.

## 2. Release of Liability

In consideration of being permitted to participate in this cruise/sightseeing trip, I hereby **release, waive, discharge, and covenant not to sue** {{captain_name}}, the vessel owner(s), crew members, and their respective officers, agents, employees, representatives, successors, and assigns (collectively, the "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or relating to any loss, damage, or injury, including death, that may be sustained by me or my property while participating in this trip, **to the fullest extent permitted by law**.

This release applies regardless of whether such loss, damage, or injury is caused by the **negligence** of the Released Parties or otherwise.

## 3. Medical Fitness

I represent that I am physically and mentally fit to participate in this cruise/sightseeing trip. I acknowledge that it is my responsibility to inform the captain of any medical conditions, allergies, disabilities, or limitations that may affect my safety or the safety of others aboard.

I understand that the captain reserves the right to refuse or limit my participation if, in the captain's sole judgment, my condition may pose a risk to myself or others.

## 4. Alcohol Consumption

I understand and acknowledge that:

- If alcoholic beverages are permitted aboard the vessel (whether provided or brought by passengers), I am solely responsible for my consumption and behavior while under the influence of alcohol
- Excessive alcohol consumption increases the risk of injury on a moving vessel and impairs judgment and coordination
- The captain reserves the right to **limit or prohibit alcohol consumption** at any time and for any reason, including safety concerns
- I will not hold the Released Parties liable for any injury, illness, or incident resulting from my voluntary consumption of alcohol
- I am of legal drinking age if I choose to consume alcohol aboard the vessel

## 5. Boarding and Disembarking Safety

I acknowledge that boarding and disembarking the vessel involves inherent risks including slippery surfaces, moving docks, water gaps, and varying vessel heights. I agree to:

- Use handrails and designated boarding areas when entering and exiting the vessel
- Accept assistance from the captain or crew when offered
- Wear appropriate footwear suitable for a boat (non-marking, non-slip, closed-toe shoes are recommended)
- Exercise caution and take my time when boarding and disembarking

## 6. Personal Property

I understand that I bring personal belongings aboard at my own risk. The Released Parties are **not responsible for any loss, theft, or damage** to personal property, including but not limited to electronics, cameras, jewelry, eyewear, phones, bags, and clothing. I agree to secure my belongings appropriately during the trip.

## 7. Safety Instructions and Vessel Rules

I agree to:

- Listen to and follow all safety briefings, instructions, and directions given by the captain and crew
- Wear a life jacket or personal flotation device (PFD) when instructed to do so
- Refrain from any behavior that could endanger myself, other passengers, or the crew
- Remain seated or hold on to secure points when the vessel is in motion, as directed by the captain

I understand that the captain has **final authority** over all matters of safety aboard the vessel and may terminate the trip at any time if safety conditions warrant.

## 8. Coast Guard and Safety Equipment

I acknowledge that the vessel is equipped with U.S. Coast Guard-required safety equipment, including life jackets, fire extinguisher(s), and visual distress signals. I understand that the location of this safety equipment has been or will be pointed out to me during the safety briefing.

## 9. Photo and Video Release

I grant {{captain_name}} and their representatives permission to take photographs and/or video recordings of me during the charter trip and to use such images for promotional, marketing, or social media purposes without further consent or compensation. I understand I may opt out of this by notifying the captain before departure.

## 10. Governing Law and Severability

This waiver shall be governed by applicable federal maritime law and the laws of the state in which the trip departs. If any provision of this waiver is found to be unenforceable, the remaining provisions shall remain in full force and effect.

## 11. Acknowledgment

**I have read this waiver and release of liability, fully understand its terms, and understand that I am giving up substantial rights, including my right to sue. I sign this agreement freely and voluntarily without any inducement.**`,
  },

  // =========================================================================
  // 4. Minor Passenger Waiver Addendum
  // =========================================================================
  {
    key: 'minor-passenger-addendum',
    title: 'Minor Passenger Waiver Addendum',
    description:
      'Supplemental waiver for passengers under 18 — requires parent/guardian consent, emergency medical authorization, and guardian responsibility.',
    category: 'minor',
    content: `# MINOR PASSENGER WAIVER ADDENDUM — PARENTAL/GUARDIAN CONSENT

**Vessel:** {{vessel_name}}
**Captain/Operator:** {{captain_name}}
**Trip Type:** {{trip_type}}
**Trip Date:** {{trip_date}}
**Parent/Guardian Name:** {{passenger_name}}
**Date Signed:** {{current_date}}

---

*This addendum must be completed by a parent or legal guardian for any passenger under 18 years of age. This is in addition to the primary liability waiver for the trip.*

## 1. Minor Passenger Information

I, **{{passenger_name}}**, am the parent or legal guardian of the minor passenger(s) listed in the booking who will be participating in the charter trip aboard **{{vessel_name}}** on **{{trip_date}}**.

## 2. Parental/Guardian Consent

I hereby give my full and informed consent for the above-named minor(s) to participate in this charter boat trip. I confirm that:

- I have the legal authority to provide consent on behalf of the minor(s)
- I have read and understood the primary liability waiver for this trip
- I have explained the nature of the trip and its inherent risks to the minor(s) in an age-appropriate manner
- The minor(s) is/are physically and mentally capable of participating in this trip

## 3. Assumption of Risk on Behalf of Minor

I acknowledge and accept all inherent risks of this charter boat trip on behalf of the minor(s), as described in the primary liability waiver. I understand that maritime and boating activities carry risks including but not limited to changing sea conditions, vessel motion, sun exposure, marine wildlife, and the distance from emergency medical facilities.

I **freely accept and assume all such risks** on behalf of the minor(s), both known and unknown.

## 4. Release of Liability on Behalf of Minor

On behalf of myself and the minor(s), I hereby **release, waive, discharge, and covenant not to sue** {{captain_name}}, the vessel owner(s), crew members, and their respective officers, agents, employees, representatives, successors, and assigns (collectively, the "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or relating to any loss, damage, or injury, including death, that may be sustained by the minor(s) or their property while participating in this charter trip, **to the fullest extent permitted by law**.

## 5. Guardian Responsibility

I agree to:

- Supervise the minor(s) at all times during the trip, including during boarding and disembarking
- Ensure the minor(s) follows all safety instructions given by the captain and crew
- Ensure the minor(s) wears a life jacket or personal flotation device (PFD) when instructed or when required by law
- Be personally present aboard the vessel for the duration of the trip
- Immediately inform the captain of any special needs, medical conditions, allergies, or behavioral considerations related to the minor(s)

I understand that I am **solely responsible** for the minor(s) at all times during this trip.

## 6. Emergency Medical Treatment Authorization

In the event of an emergency where I am unable to provide consent or am unavailable, I hereby authorize {{captain_name}} and/or emergency medical personnel to provide or arrange for **emergency medical treatment** for the minor(s) as deemed necessary. This authorization includes but is not limited to:

- First aid treatment aboard the vessel
- Emergency transport to a medical facility
- Emergency medical procedures as determined by qualified medical personnel

I understand that the captain and crew are not medical professionals and that any first aid provided will be basic in nature.

## 7. Governing Law and Severability

This addendum shall be governed by applicable federal maritime law and the laws of the state in which the trip departs. If any provision of this addendum is found to be unenforceable, the remaining provisions shall remain in full force and effect.

## 8. Acknowledgment

**I have read this minor passenger waiver addendum, fully understand its terms, and confirm that I am the parent or legal guardian of the minor(s) named above. I sign this addendum freely and voluntarily, accepting full responsibility for the minor(s) during this charter trip.**`,
  },
];

/**
 * Get a standard waiver template by its key
 */
export function getStandardWaiverTemplate(
  key: string
): StandardWaiverTemplate | undefined {
  return STANDARD_WAIVER_TEMPLATES.find((t) => t.key === key);
}

/**
 * Category display labels and colors
 */
export const WAIVER_CATEGORY_CONFIG: Record<
  StandardWaiverTemplate['category'],
  { label: string; color: string }
> = {
  general: { label: 'General', color: 'bg-cyan-100 text-cyan-700' },
  fishing: { label: 'Fishing', color: 'bg-emerald-100 text-emerald-700' },
  cruise: { label: 'Cruise', color: 'bg-violet-100 text-violet-700' },
  minor: { label: 'Minor', color: 'bg-amber-100 text-amber-700' },
};
