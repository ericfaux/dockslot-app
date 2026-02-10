// ---------------------------------------------------------------------------
// Full article content for Help Center documentation
// ---------------------------------------------------------------------------

export interface ArticleBlock {
  type: "text" | "tip";
  content: string; // Supports **bold** inline markers
}

export interface ArticleData {
  slug: string;
  title: string;
  sectionId: string;
  sectionTitle: string;
  blocks: ArticleBlock[];
}

export const articles: ArticleData[] = [
  // =========================================================================
  // GETTING STARTED
  // =========================================================================
  {
    slug: "profile",
    title: "Setting up your profile",
    sectionId: "getting-started",
    sectionTitle: "Getting Started",
    blocks: [
      {
        type: "text",
        content:
          "Head to **Settings > Profile** to fill in your captain details. Enter your full name, email address, phone number, business name, and timezone. Your business name appears on booking confirmations and your public booking page, so make sure it represents your charter operation well.",
      },
      {
        type: "text",
        content:
          "Your email and phone number are used for account notifications \u2014 booking alerts, payment updates, and system messages. These aren\u2019t shared with guests unless you choose to display them on your booking page.",
      },
      {
        type: "text",
        content:
          "Pick the correct timezone for your home port. DockSlot uses your timezone to display availability slots and send reminders at the right local time. If you travel between regions, update this setting so your schedule stays accurate.",
      },
      {
        type: "text",
        content:
          "You can also upload a profile photo and write a short bio. Guests see these on your public booking page, so a friendly photo and a few words about your experience go a long way toward building trust before they even step on the boat.",
      },
      {
        type: "tip",
        content:
          "Keep your business name consistent with what\u2019s on your website and social media. It helps guests recognize you and builds credibility.",
      },
    ],
  },
  {
    slug: "trip-types",
    title: "Adding trip types",
    sectionId: "getting-started",
    sectionTitle: "Getting Started",
    blocks: [
      {
        type: "text",
        content:
          'Navigate to **Settings > Trip Types** to create the different trips you offer. Each trip type needs a name (like "Half-Day Inshore" or "Sunset Cruise"), a duration, a price, and a deposit amount.',
      },
      {
        type: "text",
        content:
          "The duration determines how long the trip blocks your calendar. For example, a 4-hour trip type will reserve a 4-hour window when a guest books it. Set this accurately so your availability stays correct throughout the day.",
      },
      {
        type: "text",
        content:
          "Pricing is straightforward \u2014 enter the total trip price and the deposit amount guests pay at booking time. The remaining balance can be collected on the day of the trip. If you don\u2019t want to require a deposit, set it to zero.",
      },
      {
        type: "text",
        content:
          "Each trip type appears as a selectable option on your public booking page. Guests see the name, duration, price, and any description you write. A clear, descriptive name helps guests pick the right trip without confusion.",
      },
      {
        type: "text",
        content:
          "You can enable or disable trip types at any time. Disabling a trip type hides it from your booking page without deleting it, so you can bring it back for seasonal offerings whenever you\u2019re ready.",
      },
      {
        type: "tip",
        content:
          "Add a short description to each trip type \u2014 mention what species guests might target, what\u2019s included, or what makes the trip special. It helps guests decide and reduces pre-booking questions.",
      },
    ],
  },
  {
    slug: "vessels",
    title: "Configuring vessels",
    sectionId: "getting-started",
    sectionTitle: "Getting Started",
    blocks: [
      {
        type: "text",
        content:
          "Go to **Settings > Vessels** to add the boats you run trips on. Each vessel needs a name and a maximum passenger capacity. The capacity sets the upper limit for party size when guests book a trip.",
      },
      {
        type: "text",
        content:
          "If you operate a single boat, add it here and you\u2019re set. If you run multiple vessels, add each one with its own name and capacity. DockSlot assigns a vessel to each booking, and guests can see which boat they\u2019ll be on in their confirmation.",
      },
      {
        type: "text",
        content:
          "Vessel capacity directly affects the booking flow. When a guest selects a trip, they can\u2019t choose a party size larger than the assigned vessel\u2019s capacity. This prevents overbooking and sets clear expectations before the trip.",
      },
      {
        type: "text",
        content:
          "You can update vessel details at any time. If a boat goes in for maintenance or you add a new vessel to your fleet, just edit or add the entry in Settings. Existing bookings on a vessel aren\u2019t affected when you update its details.",
      },
      {
        type: "tip",
        content:
          "Use a recognizable vessel name \u2014 if your boat has a name your customers know, use that instead of something generic. It adds personality and helps repeat guests feel at home.",
      },
    ],
  },
  {
    slug: "availability",
    title: "Setting your availability",
    sectionId: "getting-started",
    sectionTitle: "Getting Started",
    blocks: [
      {
        type: "text",
        content:
          "Open **Settings > Availability** to control when guests can book trips. The weekly schedule lets you toggle each day of the week on or off and set specific time ranges for when you\u2019re available.",
      },
      {
        type: "text",
        content:
          "For each active day, define the start and end times for your booking window. For example, you might be available Monday through Saturday from 6:00 AM to 6:00 PM, with Sundays off. Guests will only see open time slots that fit within your configured schedule.",
      },
      {
        type: "text",
        content:
          "**Blackout dates** let you block off specific days regardless of your weekly schedule. Use them for holidays, personal time, boat maintenance, or any day you don\u2019t want bookings. Just select the date and it\u2019s removed from your calendar \u2014 guests won\u2019t see it as available.",
      },
      {
        type: "text",
        content:
          "Your availability works together with your trip type durations. DockSlot only shows time slots where a trip can fit completely within your available window. If a 4-hour trip wouldn\u2019t finish before your end time, that slot won\u2019t appear.",
      },
      {
        type: "tip",
        content:
          "Review your availability at the start of each season. Adjusting your hours for summer versus winter ensures guests see accurate options year-round.",
      },
    ],
  },
  {
    slug: "booking-link",
    title: "Sharing your booking link",
    sectionId: "getting-started",
    sectionTitle: "Getting Started",
    blocks: [
      {
        type: "text",
        content:
          "Your unique DockSlot booking link is the gateway for guests to find and book your trips. You\u2019ll find it front and center on your **Dashboard** \u2014 just click the copy button to grab it.",
      },
      {
        type: "text",
        content:
          "Share the link anywhere your potential guests are. Post it on your social media profiles, add it to your website or bio link, include it in your Google Business listing, or text it directly to customers who inquire about trips. The more places you share it, the more bookings you\u2019ll see.",
      },
      {
        type: "text",
        content:
          "When someone opens your link, they land on your public booking page showing your profile, available trip types, and open dates. From there, they can complete a booking in just a few steps. No app download or account creation is required for guests.",
      },
      {
        type: "text",
        content:
          "You can also include the link in email signatures, on fishing forum profiles, or in response to messages on social media. It\u2019s a permanent link \u2014 it won\u2019t change, so anything you print or post stays valid.",
      },
      {
        type: "tip",
        content:
          "Pin your booking link in your social media bios and include it in every customer interaction. The easier it is to find, the more bookings roll in. Smooth sailing starts with a single link.",
      },
    ],
  },

  // =========================================================================
  // MANAGING BOOKINGS
  // =========================================================================
  {
    slug: "viewing-bookings",
    title: "Viewing your bookings",
    sectionId: "managing-bookings",
    sectionTitle: "Managing Bookings",
    blocks: [
      {
        type: "text",
        content:
          "The **Bookings** page is your command center for all reservations. Every booking appears in a searchable, sortable list showing the guest name, trip type, date, party size, status, and payment info at a glance.",
      },
      {
        type: "text",
        content:
          'Use the search bar to find bookings by guest name, email, or confirmation number. Filter by status (Confirmed, Pending, Cancelled, Completed) or date range to narrow down what you\u2019re looking for. Presets like "Today," "This Week," and "Upcoming" help you jump to the most relevant bookings quickly.',
      },
      {
        type: "text",
        content:
          "Click on any booking to open the detail view. Here you\u2019ll see the full trip information, guest contact details, payment history, waiver status, and any notes. From the detail view, you can confirm, cancel, or modify the booking.",
      },
      {
        type: "text",
        content:
          "The **Schedule view** offers an alternative calendar layout where bookings appear on their respective dates. This is handy for seeing your week at a glance and spotting open slots.",
      },
      {
        type: "tip",
        content:
          "Check the Bookings page first thing each morning to review the day\u2019s trips and make sure everything is confirmed. A quick daily review keeps surprises off the water.",
      },
    ],
  },
  {
    slug: "confirming-cancelling",
    title: "Confirming and cancelling bookings",
    sectionId: "managing-bookings",
    sectionTitle: "Managing Bookings",
    blocks: [
      {
        type: "text",
        content:
          "Every booking in DockSlot follows a status lifecycle. New bookings arrive as **Awaiting Deposit** (if a deposit is required) or **Pending**. Once the deposit is received, the booking moves to **Confirmed**. After the trip date passes, it\u2019s marked **Completed**. You can also mark bookings as **Cancelled** or **No Show** at any point.",
      },
      {
        type: "text",
        content:
          "To confirm a booking, open it from the Bookings page and click the confirm action. The guest receives an automatic confirmation email and SMS (if enabled) with all the trip details \u2014 date, time, location, and what to bring.",
      },
      {
        type: "text",
        content:
          "Cancelling works the same way. Open the booking, select cancel, and optionally add a reason. The guest is notified immediately and any refund is handled according to the cancellation policy you\u2019ve configured in Settings. If the guest paid a deposit, the refund amount follows your policy rules automatically.",
      },
      {
        type: "text",
        content:
          "For no-shows, mark the booking accordingly after the trip date. This helps you track patterns and is useful if you have a no-show policy that affects future bookings or deposits.",
      },
      {
        type: "tip",
        content:
          'Confirm bookings promptly \u2014 guests appreciate knowing their trip is locked in. A quick confirmation builds trust and reduces "did they get my booking?" follow-up messages.',
      },
    ],
  },
  {
    slug: "weather-holds",
    title: "Weather holds",
    sectionId: "managing-bookings",
    sectionTitle: "Managing Bookings",
    blocks: [
      {
        type: "text",
        content:
          "DockSlot monitors NOAA weather data for your area to help you manage trips when conditions turn rough. When wind speeds, wave heights, or storm forecasts exceed safe thresholds, you\u2019ll see weather alerts on your Dashboard.",
      },
      {
        type: "text",
        content:
          "When bad weather threatens an upcoming trip, you can place the booking on **weather hold**. This notifies the guest that the trip is weather-dependent and may need to be rescheduled. Guests receive an email and SMS explaining the situation and letting them know you\u2019ll follow up with a plan.",
      },
      {
        type: "text",
        content:
          "To resolve a weather hold, you have two options: **reschedule** the trip to a new date or **cancel** it. If you reschedule, the guest receives the updated trip details automatically. If you cancel, your standard cancellation and refund policies apply.",
      },
      {
        type: "text",
        content:
          "Weather holds are visible on the Bookings page with a distinct status badge, so you can quickly see which trips are affected. The Dashboard also highlights upcoming trips with weather concerns so nothing slips through.",
      },
      {
        type: "tip",
        content:
          "Place weather holds as early as possible \u2014 ideally 24\u201348 hours before the trip. This gives guests time to adjust their plans and shows that you prioritize their safety. Nobody wants surprises at the dock.",
      },
    ],
  },
  {
    slug: "deposits",
    title: "Deposits and payments",
    sectionId: "managing-bookings",
    sectionTitle: "Managing Bookings",
    blocks: [
      {
        type: "text",
        content:
          "DockSlot uses **Stripe** to handle all payment processing securely. To get started, connect your Stripe account in **Settings > Payments**. Once connected, you can accept deposits and payments directly through the booking flow.",
      },
      {
        type: "text",
        content:
          "When a guest books a trip, they pay the deposit amount you\u2019ve configured for that trip type. This can be a flat dollar amount or a percentage of the total trip price. Deposits are processed immediately through Stripe and appear in your Stripe dashboard.",
      },
      {
        type: "text",
        content:
          "The remaining balance \u2014 the trip price minus the deposit \u2014 is collected separately, typically on the day of the trip. You can collect the balance through Stripe using the booking detail page, or handle it outside DockSlot (cash, check, etc.) based on your preference.",
      },
      {
        type: "text",
        content:
          "From the guest\u2019s perspective, the payment flow is simple. They see the total price and deposit amount during booking, enter their card information on a secure Stripe checkout form, and receive a receipt by email. No surprises, no confusion.",
      },
      {
        type: "text",
        content:
          "The **Payments** page in DockSlot gives you a full ledger of all transactions, including deposits received, refunds issued, and payout timelines. Use it to reconcile your books and track revenue.",
      },
      {
        type: "tip",
        content:
          "Requiring a deposit \u2014 even a small one \u2014 significantly reduces no-shows. Guests who\u2019ve put money down are much more likely to show up. It\u2019s a win for everyone.",
      },
    ],
  },

  // =========================================================================
  // GUEST EXPERIENCE
  // =========================================================================
  {
    slug: "booking-flow",
    title: "The booking flow",
    sectionId: "guest-experience",
    sectionTitle: "Guest Experience",
    blocks: [
      {
        type: "text",
        content:
          "When a guest opens your DockSlot booking link, they\u2019re guided through a simple 4-step flow that takes about two minutes to complete.",
      },
      {
        type: "text",
        content:
          "**Step 1 \u2014 Select Trip:** Guests see your available trip types with names, descriptions, durations, and prices. They pick the trip that interests them.",
      },
      {
        type: "text",
        content:
          "**Step 2 \u2014 Select Date:** A calendar shows your available dates and time slots for the chosen trip type. Only open slots appear, so there\u2019s no guessing about when you\u2019re free. Guests select a date and time that works for them.",
      },
      {
        type: "text",
        content:
          "**Step 3 \u2014 Guest Info:** Guests enter their name, email, phone number, and party size. The party size is limited by the assigned vessel\u2019s capacity. If you require any additional information, it\u2019s collected here as well.",
      },
      {
        type: "text",
        content:
          "**Step 4 \u2014 Confirm & Pay:** Guests review the trip summary \u2014 date, time, trip type, party size, and pricing. If a deposit is required, they enter payment details through a secure Stripe form. Once they submit, the booking is created and they receive a confirmation email instantly.",
      },
      {
        type: "text",
        content:
          "The entire flow is mobile-friendly, so guests can book from their phone while scrolling social media or chatting with friends. No account creation is required \u2014 guests just need their contact info and a payment method.",
      },
      {
        type: "tip",
        content:
          "Test the booking flow yourself by opening your booking link in an incognito window. Seeing what your guests see helps you write better trip descriptions and catch any issues before they do.",
      },
    ],
  },
  {
    slug: "guest-confirmations",
    title: "Confirmations and reminders",
    sectionId: "guest-experience",
    sectionTitle: "Guest Experience",
    blocks: [
      {
        type: "text",
        content:
          "DockSlot automatically keeps your guests informed from the moment they book until the day of their trip. Here\u2019s what they receive:",
      },
      {
        type: "text",
        content:
          "**Booking Confirmation:** Immediately after booking, guests get an email (and SMS if enabled) confirming their reservation. It includes the trip type, date, time, meeting location, party size, deposit paid, and remaining balance.",
      },
      {
        type: "text",
        content:
          "**Deposit Reminder:** If a guest has an unpaid deposit or pending balance, DockSlot sends a reminder to complete the payment before the trip date arrives.",
      },
      {
        type: "text",
        content:
          "**Trip Reminders:** Guests receive reminders leading up to their trip \u2014 typically 48 hours and 24 hours before. These include the trip details, weather outlook, meeting location, and anything they should bring.",
      },
      {
        type: "text",
        content:
          '**Day-of Reminder:** On the morning of the trip, a final reminder goes out with last-minute details like dock location and check-in time. This reduces late arrivals and "where do I go?" calls.',
      },
      {
        type: "text",
        content:
          "All notifications include your business name so guests immediately recognize who the message is from. You can customize reminder timing in **Settings > Notifications** to match your preferences.",
      },
      {
        type: "tip",
        content:
          "Enable SMS notifications if your guests tend to miss emails. A text message the morning of the trip is the single best way to prevent no-shows and late arrivals.",
      },
    ],
  },
  {
    slug: "guest-waivers",
    title: "Digital waivers",
    sectionId: "guest-experience",
    sectionTitle: "Guest Experience",
    blocks: [
      {
        type: "text",
        content:
          "If you require liability waivers, DockSlot lets you handle them digitally \u2014 no clipboards or lost paperwork. Set up your waiver under **Settings > Waivers** with your custom waiver text, and DockSlot takes care of the rest.",
      },
      {
        type: "text",
        content:
          "Guests receive a waiver link by email after booking. They can read and sign the waiver on their phone or computer at any time before the trip. Each guest in the party can sign individually, so everyone is covered before they step aboard.",
      },
      {
        type: "text",
        content:
          "From the booking detail view, you can track which guests have signed and which haven\u2019t. If someone hasn\u2019t signed close to the trip date, you can send a reminder nudge directly from the booking page.",
      },
      {
        type: "text",
        content:
          "Signed waivers are stored digitally on the booking record. You can view or download them at any time for your records. No more chasing down paper forms or worrying about lost signatures.",
      },
      {
        type: "text",
        content:
          "You can require waiver completion at the time of booking (before payment) or allow guests to sign later. Choose whichever approach fits your operation \u2014 some captains prefer to gate booking behind the waiver, while others send it as a follow-up.",
      },
      {
        type: "tip",
        content:
          "Set waivers to required-before-booking if you want zero day-of hassle. Guests complete everything upfront, and you can focus on what matters \u2014 getting on the water. You\u2019re all set, captain.",
      },
    ],
  },
  {
    slug: "guest-manage",
    title: "Managing their booking",
    sectionId: "guest-experience",
    sectionTitle: "Guest Experience",
    blocks: [
      {
        type: "text",
        content:
          "Every guest receives a unique booking management link in their confirmation email and SMS. This link lets them view and manage their reservation without needing to call or text you.",
      },
      {
        type: "text",
        content:
          "From the management page, guests can see all their trip details \u2014 date, time, trip type, party size, meeting location, and payment status. Everything they need is in one place, accessible from any device.",
      },
      {
        type: "text",
        content:
          "If plans change, guests can request a **reschedule** through the management page. They\u2019ll see your available dates and can propose a new time. You\u2019ll receive a notification and can approve or suggest alternatives. This keeps schedule changes organized and out of your text messages.",
      },
      {
        type: "text",
        content:
          "Guests can also **cancel** their booking through the management link. The cancellation follows the policy you\u2019ve set in **Settings > Cancellation Policy**. Guests see the refund terms before confirming the cancellation, so there are no disputes about what they\u2019re owed.",
      },
      {
        type: "text",
        content:
          "For any changes that can\u2019t be handled through the self-service page \u2014 like switching trip types or changing party size significantly \u2014 guests are directed to contact you directly. This gives you control over modifications that affect logistics.",
      },
      {
        type: "tip",
        content:
          'Mention the management link when guests reach out about changes. "Check your confirmation email for a link to manage your booking" saves you time and empowers guests to self-serve. Smooth sailing for everyone.',
      },
    ],
  },
];

/**
 * Look up a single article by its URL slug.
 */
export function getArticleBySlug(slug: string): ArticleData | undefined {
  return articles.find((a) => a.slug === slug);
}
