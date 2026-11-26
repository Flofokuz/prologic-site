/* =====================================================================
   EXTENDED TEAM AFFILIATES NETWORK (ETAN) — the affiliate list
   ---------------------------------------------------------------------
   This is the ONLY file you edit to add or update an affiliate.

   TO ADD A NEW AFFILIATE (about 5 minutes):
     1. Copy one of the blocks below, paste it at the end of the list,
        and fill in the fields.
     2. Copy the folder /etan/_new/ and rename the copy to the same
        "id" you used (example: /etan/marcus/).
     3. In that copy's index.html, change data-affiliate="CHANGE-ME"
        to the same id. Done — the hub card and the booking page
        build themselves.

   FIELDS
     id         short web name, lowercase, no spaces (becomes /etan/id/)
     name       the name on the page (a placeholder is fine for now)
     alias      nickname / handle, or "" for none
     lore       their quest-board title (the fun name)
     tagline    one line on what they do
     offers     list of what they offer, one short line each
     area       where they serve
     about      2–3 sentences in their voice, or "" to leave it out
     calLink    their own free Cal.com page, e.g. "https://cal.com/their-name"
                ("" shows "Booking opens soon")
     payLink    their own payment link (Cash App, Stripe link, PayPal.me,
                Venmo…). Money goes straight to them. ("" hides the button)
     payLabel   button text for the payment link, e.g. "Pay with Cash App"
     draft      true = shows a small "page in progress" note until they
                sign off on their details
   ===================================================================== */
window.ETAN = [
  {
    id: "leon",
    name: "Leon",
    alias: "Alpha Wolf",
    lore: "The Alpha Wolf's Den",
    tagline: "Youth programs, garden and park learning days, and a circle for young entrepreneurs.",
    offers: [
      "Jump 2 Greatness youth and family programs",
      "Teaching days at community gardens and parks",
      "Alpha Pack: an entrepreneurs' circle",
      "Bring the energy to your school or community event"
    ],
    area: "Staten Island and across NYC",
    about: "",
    calLink: "",
    payLink: "",
    payLabel: "Pay Leon",
    draft: true
  },
  {
    id: "clement",
    name: "Clement",
    alias: "",
    lore: "The Grant Scribe",
    tagline: "Grant writing, reentry support, and everyday tech classes for elders.",
    offers: [
      "Grant writing for community programs",
      "Reentry and fresh-start support (R.O.L.E. Initiative)",
      "Everyday tech classes for elders: phones, tablets, the basics"
    ],
    area: "New York City (to be confirmed)",
    about: "",
    calLink: "",
    payLink: "",
    payLabel: "Pay Clement",
    draft: true
  },
  {
    id: "lowkey",
    name: "Ronnie",
    alias: "Lowkey",
    lore: "The Lion's Workshop",
    tagline: "Hands-on tech help from someone trained in the trade.",
    offers: [
      "Computer and device setup or repair",
      "Home Wi-Fi and network help",
      "A tinkerers' tech collective (coming soon)"
    ],
    area: "To be confirmed",
    about: "",
    calLink: "",
    payLink: "",
    payLabel: "Pay Ronnie",
    draft: true
  }
];
