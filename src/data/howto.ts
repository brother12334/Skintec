/**
 * Step-by-step "how to" for every routine step, keyed by step id. The Vaseline
 * step has two versions because the rule differs between recovery nights and
 * active (BHA or adapalene) nights.
 *
 * Amounts and times are what the plan asks for; where the plan doesn't say,
 * these are the usual gentle defaults for skin using BHA and a retinoid.
 */
export const HOW: Record<string, string[]> = {
  /* ---------------- Morning ---------------- */
  'am-rinse': [
    'Wash your hands first.',
    'Splash your face with lukewarm water 5–10 times. Not hot: hot water dries skin out.',
    'Run your fingertips lightly over your nose and forehead to rinse off the overnight oil. No cleanser, no scrubbing.',
  ],
  'am-dry': [
    'Use a clean towel and press it against your face. Don’t rub.',
    'Wait about a minute until your skin feels completely dry, with no cool or damp feeling. Dapsone goes on dry skin.',
  ],
  'am-dapsone': [
    'Squeeze a pea-sized amount onto one fingertip. That’s enough for your whole breakout area.',
    'Dot it onto the places you break out: forehead, cheeks, chin, wherever you usually get spots.',
    'Spread it into a thin layer until it disappears. Don’t rub hard.',
    'Let it dry for a full minute before moisturizer.',
    'Wash your hands.',
  ],
  'am-moisturizer': [
    'Take an almond-sized amount (about a fingertip’s length).',
    'Dot it on your forehead, both cheeks, nose and chin.',
    'Spread it outward from the center of your face, including your jaw and the front of your neck.',
    'Wait 1–2 minutes so it settles before sunscreen.',
  ],
  'am-sunscreen': [
    'Squeeze out two full finger-lengths (index and middle finger). That’s the amount for face and neck; less won’t give you the SPF on the label.',
    'Dot it all over your face, then spread it evenly.',
    'Don’t miss the sides of your nose, your hairline, your ears and under your jaw.',
    'Let it set for 2 minutes. Go outside no sooner than 15 minutes after.',
    'Reapply every 2 hours if you’re outside, and after sweating or swimming.',
  ],

  /* ---------------- Night: cleanse ---------------- */
  'pm-oil': [
    'Start with a dry face and dry hands. Don’t wet anything first, or the oil can’t dissolve sunscreen and gunk.',
    'Pump 2–3 pumps into your palm and rub your hands together to warm it.',
    'Press it over your whole face, then massage everywhere for about 30 seconds: forehead, cheeks, hairline and jaw, where sunscreen sits.',
    'Exfoliating massage on your nose for 60 seconds: small, light circles with your fingertips over the tip, the sides and the crease next to each nostril, then your chin. You may feel tiny grits loosening. That’s the gunk in your pores coming out.',
    'Keep the pressure light. Never squeeze or pinch your pores.',
    'Wet your fingertips and keep massaging for 20–30 seconds, adding a little water at a time, until it’s fully milky white everywhere.',
    'Rinse with lukewarm water, at least 10 splashes, until your skin doesn’t feel slick.',
  ],
  'pm-blanc': [
    'Don’t dry off. Your face stays damp from the oil rinse.',
    'Lather a pea-sized amount between wet palms.',
    'Massage for 30–45 seconds, focusing on your forehead, hairline and the sides of your nose, where the oil film builds up.',
    'Rinse with at least 10 splashes, then check your hairline and jaw for leftover suds.',
    'Your skin should feel clean but not squeaky or tight. Tight means the water was too hot or you scrubbed too long.',
  ],
  'pm-dry': [
    'Press a clean towel against your face. Don’t rub.',
    'Wait 2–5 minutes, until there’s no damp or cool feeling anywhere, especially around your nose. Actives sting more on damp skin.',
  ],

  /* ---------------- Night: actives ---------------- */
  'pm-bha': [
    'Wet a cotton pad with the BHA until it’s damp but not dripping, or put 3–4 drops on your fingertips.',
    'Nose first: one full layer over the tip, the sides and the bridge. This is your exfoliation step for the night.',
    'Then one lighter pass over your forehead and cheeks.',
    'Skip your eyes, the corners of your nose and mouth, and any picked or raw spots.',
    'Don’t rinse it off and don’t go over the same area twice.',
  ],
  'pm-bha-wait': [
    'Set a timer for 2–3 minutes.',
    'Your skin should feel dry, not wet or tacky, before moisturizer goes on.',
  ],
  'pm-adapalene': [
    'Put a pea-sized amount on one fingertip. That’s for your whole face, not one area.',
    'Make 5 dots: forehead, each cheek, nose and chin.',
    'Spread each dot into a very thin layer. Give your forehead and the places you get bumps a little more attention.',
    'Keep it away from your eyes, the corners of your mouth and the creases beside your nose.',
    'Wash your hands, then go straight on to moisturizer.',
  ],

  /* ---------------- Night: masks ---------------- */
  'pm-mask-clay': [
    'Spread a thin layer only on your nose and T-zone: a strip across your forehead, down your nose, and your chin.',
    'Leave it 5–10 minutes. Take it off as soon as it lightens at the edges, before it dries completely and cracks.',
    'Rinse with lukewarm water using soft wet fingers. Don’t scrub it off.',
    'Pat dry, then moisturizer and Vaseline.',
  ],
  'pm-mask-hydrating': [
    'Sheet mask: unfold it, line up the eye and mouth holes, and smooth out any air bubbles.',
    'Leave it on for the time on the pack, usually 15–20 minutes. Take it off before it starts to dry.',
    'Pat the leftover essence into your skin. Don’t rinse.',
    'Then moisturizer and Vaseline.',
  ],

  /* ---------------- Night: seal ---------------- */
  'pm-moisturizer': [
    'Take an almond-sized amount.',
    'Dot it on your forehead, both cheeks, nose and chin.',
    'Spread it outward over your whole face, jaw and front of your neck.',
    'If adapalene was too irritating, this is the second layer of the “sandwich”: moisturizer, adapalene, moisturizer.',
  ],
  'pm-vaseline-recovery': [
    'Take a pea-sized amount and warm it between your fingertips.',
    'Press it in a thin layer over your whole face. Pat, don’t rub.',
    'Stop just short of your hairline so it doesn’t sit in your hair.',
    'It should look shiny, not thick or dripping.',
    'Sleep on a clean pillowcase if you can.',
  ],
  'pm-vaseline-active': [
    'Take an amount the size of a grain of rice.',
    'Dab it only on dry patches, flaky spots, or healing picked spots.',
    'A thin dab on the corners of your nose and mouth also protects them from the active.',
    'Never spread it over the areas where the BHA or adapalene went. It makes the active stronger and more irritating.',
    'No dry spots tonight? Skip this step.',
  ],
};
