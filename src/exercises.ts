import type { Exercise } from './types';


/** The routine, in order. */
export const exercises: Exercise[] = [
  {
    id: 'low-breathing',
    name: 'Low breathing',
    purpose: 'Puts the breath under the voice so the throat does not have to work.',
    subSteps: [
      {
        text: 'One hand on your belly, one on your chest. Shoulders down. In through the nose: the belly hand moves, the chest hand stays still.',
        weight: 0,
      },
      { text: 'In for 4, out on a steady “sss” for 8.', pace: { inSec: 4, outSec: 8 } },
    ],
    tips: ['If your shoulders rise, the breath is high. Let them drop and start again.'],
    control: 'reps',
    reps: { short: 5, full: 8 },
    repSec: 12,
    repNoun: 'breath',
    animation: 'low-breathing',
    links: [],
  },
  {
    id: 'articulation',
    name: 'Jaw, tongue and articulation',
    purpose: 'Frees the jaw and tongue so the consonants come out crisp instead of mumbled.',
    subSteps: [
      {
        text: 'Massage the jaw muscles with your fingertips and let the jaw hang loose. Teeth apart, lips soft.',
        window: [0, 0.25],
      },
      {
        text: 'Yawn-sigh: yawn with the mouth wide, then sigh out on a gentle “hah” from high to low.',
        reps: 3,
        window: [0.25, 0.5],
      },
      {
        text: 'Tongue trill: a rolled “rrr” on one easy pitch. If it won’t go, fast “la-la-la” or “ttt-ddd” instead.',
        window: [0.5, 0.75],
      },
      {
        text: 'Tongue twisters, each twice: slow and over-articulated first, then at speaking pace.',
        weight: 0,
        window: [0.75, 1],
        examples: ['Red leather, yellow leather', 'Unique New York', 'Toy boat, toy boat', 'Big black bugs bleed blue-black blood'],
      },
    ],
    tips: ['Crisp consonants come from a loose jaw and a quick tongue, not from effort.'],
    duration: { short: 60, full: 90 },
    animation: 'articulation',
    links: [
      { label: 'Vinh Giang: how to become more articulate', url: 'https://vinhgiang.com/blog/how-to-become-more-articulate' },
      {
        label: 'Royal Berkshire NHS: voice warm-up and warm-down (PDF)',
        url: 'https://royalberkshire.nhs.uk/media/5ehceiw2/voice-warm-up-and-warm-down_apr24.pdf',
      },
    ],
  },
  {
    id: 'straw',
    name: 'Straw phonation',
    purpose: 'Back-pressure from the straw lets the vocal folds vibrate with the least effort.',
    subSteps: [
      { text: 'Thin stirring straw between the lips. No air leaking around it.', weight: 0, window: [0, 0.12] },
      { text: 'Hum gently through the straw on a comfortable pitch.', window: [0.12, 0.3] },
      { text: 'Slow sirens through the straw: low to high to low, smooth.', weight: 2, window: [0.3, 0.64] },
      {
        text: '“Speak” a sentence through it. Three times:',
        reps: 3,
        window: [0.64, 0.82],
        examples: ['How are you today?', 'Where are you going?', 'Nice to see you.'],
      },
      { text: 'Hum a tune through it: “God Save the King”.', weight: 0, window: [0.82, 1] },
    ],
    tips: ['Never push. If it feels like effort, blow softer.'],
    duration: { short: 90, full: 180 },
    animation: 'straw',
    links: [
      {
        label: 'Titze: introduction to straw phonation (PDF)',
        url: 'https://www.vocology.utah.edu/_resources/documents/intro_a_video_straw_phonation_titze.pdf',
      },
    ],
  },
  {
    id: 'lip-trills',
    name: 'Lip trills',
    purpose: 'Loosens the lips and jaw and gets the voice going on gentle, steady airflow.',
    subSteps: [
      { text: 'Loose lips, not pursed. Blow gently until they buzz. No voice yet.', window: [0, 0.18] },
      { text: 'Add voice: “brrr” on one easy pitch.', window: [0.18, 0.36] },
      { text: 'Glide low to high, then high to low.', weight: 2, window: [0.36, 0.7] },
      {
        text: 'Add a vowel on the end. Once each:',
        weight: 0,
        window: [0.7, 0.85],
        examples: ['brrr-ah', 'brrr-ee', 'brrr-eye', 'brrr-ay', 'brrr-oar'],
      },
      {
        text: 'Add a word on the end. Once each:',
        weight: 0,
        window: [0.85, 1],
        examples: ['brrr-ine', 'brrr-awn', 'brrr-ain', 'brrr-ight', 'brrr-eeze', 'brrr-own', 'brrr-and', 'brrr-aid', 'brrr-oom', 'brrr-ush'],
      },
    ],
    tips: ['Lips won’t trill? Press your cheeks lightly with two fingertips to take the weight off.'],
    duration: { short: 90, full: 180 },
    animation: 'lip-trills',
    links: [
      { label: 'Cambridge University Hospitals: lip trills handout', url: 'https://www.cuh.nhs.uk/patient-information/lip-trills-exercises/' },
      {
        label: 'Royal Berkshire NHS: humming and lip trills',
        url: 'https://royalberkshire.nhs.uk/leaflets/reducing-vocal-tension-using-humming-exercises-and-lip-trills',
      },
      { label: 'County Durham and Darlington NHS: lip trill demo video', url: 'https://youtu.be/LSbmqhPvW60' },
      { label: 'Vinh Giang: 3 exercises to deepen your voice (lip trills at 2:59)', url: 'https://www.youtube.com/watch?v=HT9_VxN8iSE&t=179s' },
    ],
  },
  {
    id: 'sirens',
    name: 'Sirens',
    purpose: 'Stretches the whole range so the speaking voice has room to move.',
    subSteps: [
      {
        text: 'Hum or “oo”. Glide from the bottom of your range to the top and back, smooth like a distant siren.',
        weight: 2,
        window: [0, 0.5],
      },
      { text: 'Nudge gently past the comfortable edges on each pass.', window: [0.5, 1] },
    ],
    tips: ['Spend the time in the upper-middle of your range. Pushing for the bottom adds pressure, which undoes the straw and trill work.'],
    duration: { short: 60, full: 120 },
    animation: 'sirens',
    links: [{ label: 'Vinh Giang: siren at 0:54', url: 'https://www.youtube.com/watch?v=HT9_VxN8iSE&t=54s' }],
  },
  {
    id: 'hum',
    name: 'Hum into words',
    purpose: 'Brings the buzz forward into the face and carries it into speech.',
    subSteps: [
      { text: '“Mmm” with lips closed. Feel the buzz in the lips and nose, not pressure in the throat.', window: [0, 0.3] },
      { text: '“Mmm-ah”. Keep the buzz as the mouth opens.', reps: 5, window: [0.3, 0.55] },
      { text: '“Mmm-many”, “mmm-money”. Same forward, easy feel.', reps: 5, window: [0.55, 0.8] },
      {
        text: 'Short phrases with the same quality. This is the speaking voice now.',
        reps: 5,
        window: [0.8, 1],
        examples: ['My mother', 'Many men', 'Move over', 'Morning melody', 'Mandy makes mince', 'Nine mean men'],
      },
    ],
    duration: { short: 60, full: 120 },
    animation: 'hum',
    links: [
      {
        label: 'Royal Berkshire NHS handout, exercises 3a to 3e',
        url: 'https://royalberkshire.nhs.uk/leaflets/reducing-vocal-tension-using-humming-exercises-and-lip-trills',
      },
    ],
  },
  {
    id: 'dynamics',
    name: 'Volume and dynamics',
    purpose: 'Trains loud and soft on breath alone, so the voice can carry without squeezing.',
    subSteps: [
      {
        text: 'Hum or “ah” on an easy mid pitch. Swell from quiet to speaking-loud and back to quiet over about 8 seconds. Breathe, then again.',
        weight: 2,
        repSec: 12,
        window: [0, 0.5],
      },
      {
        text: 'Count 1 to 10 getting steadily louder on breath alone, then 10 to 1 getting quieter. Twice.',
        weight: 1,
        reps: 2,
        window: [0.5, 0.75],
      },
      {
        text: 'Call a short phrase across the room on a fresh low breath, then say it at normal volume with the same open throat.',
        weight: 1,
        reps: 3,
        window: [0.75, 1],
        examples: ['Over here!', 'Morning!', 'Hello there'],
      },
    ],
    tips: [
      'Louder comes from more air and more space, never from squeezing the throat.',
      'If the throat tightens on a swell, the swell was too big. Make the next one smaller.',
    ],
    duration: { short: 60, full: 120 },
    animation: 'dynamics',
    links: [],
  },
  {
    id: 'vfe',
    name: 'Vocal function exercises',
    purpose: 'Four steps from voice therapy. Your longest hold shows progress.',
    subSteps: [
      {
        text: 'Warm up: soft nasal “ee” on a comfortable mid pitch, as long as you can. Twice.',
        reps: 2,
        window: [0, 0.2],
      },
      { text: 'Stretch: glide low to high on “knoll”. Twice.', reps: 2, window: [0.2, 0.36] },
      { text: 'Contract: glide high to low on “knoll”. Twice.', reps: 2, window: [0.36, 0.52] },
      {
        text: 'Adduction: sustain “ol” softly on five successive pitches. Twice each, a fresh breath for each.',
        reps: 10,
        repsPerPitch: 2,
        window: [0.52, 1],
      },
    ],
    tips: ['Time the sustains. Longer over weeks means a stronger, more efficient voice.'],
    duration: { short: 240, full: 240 },
    defaultOff: ['short'],
    days: { short: [1, 3, 5] },
    animation: 'vfe',
    panel: 'sustain',
    links: [
      { label: 'Step-by-step guide (Adult Speech Therapy Workbook)', url: 'https://theadultspeechtherapyworkbook.com/vocal-function-exercises/' },
      {
        label: 'Stemple’s course on MedBridge (clinician-oriented)',
        url: 'https://www.medbridge.com/educate/courses/vocal-function-exercises-joseph-stemple-speech-langauge-pathology-vocal-therapy',
      },
    ],
  },
  {
    id: 'read-aloud',
    name: 'Pitch, pause and pace read-aloud',
    purpose: 'Breaks the monotone habit by over-practising movement in pitch, pause and pace, then dialling it back.',
    subSteps: [
      { text: 'Read it once completely over the top. Exaggerate every rise and fall.', weight: 0, window: [0, 0.25] },
      { text: 'Read it again at 70 percent. Keep the movement, lose the parody.', weight: 0, window: [0.25, 0.5] },
      {
        text: 'Pause pass: a deliberate beat of silence before every bold word. The silence is the emphasis.',
        weight: 0,
        window: [0.5, 0.75],
      },
      {
        text: 'Pace pass: one clause slow and weighty, the next quick and light. Exaggerate first, then dial back.',
        weight: 0,
        window: [0.75, 1],
      },
    ],
    control: 'untimed',
    duration: { short: 180, full: 180 },
    defaultOff: ['short'],
    days: { short: [2, 4, 6] },
    animation: 'read-aloud',
    panel: 'reading',
    links: [],
  },
  {
    id: 'cool-down',
    name: 'Cool-down',
    purpose: 'Lets the voice settle after the heavy work, so it is not tired later in the day.',
    subSteps: [
      {
        text: 'Straw or loose lips: gentle hums sliding down from the middle of your range, each one softer than the last. Nothing above a sigh.',
        window: [0, 0.75],
      },
      { text: 'Swallow, let the shoulders drop, and say one easy sentence in your everyday voice.', weight: 0, window: [0.75, 1] },
    ],
    tips: ['If the voice feels tired, this is the step to stretch, not skip.'],
    duration: { short: 30, full: 30 },
    defaultOff: ['short'],
    days: { short: [1, 3, 5] },
    animation: 'cool-down',
    links: [],
  },
];
