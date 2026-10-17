import type { Exercise } from './types';

const AUDIO_BASE = import.meta.env.BASE_URL + 'audio/';

/**
 * The routine, in order. Edit freely:
 * - duration is seconds per routine; 0 leaves it out of that routine
 * - animation must match an id registered in animations/index.ts, or null
 * - cues are the 3-5 lines shown on screen; tips go behind "More detail"
 */
export const exercises: Exercise[] = [
  {
    id: 'low-breathing',
    name: 'Low breathing',
    purpose: 'Puts the breath under the voice so the throat does not have to work.',
    cues: [
      'One hand on your belly, one on your chest.',
      'In through the nose for 4. The belly hand moves, the chest hand stays still.',
      'Out on a steady “sss” for 8. Keep the sound even to the end.',
      'Repeat 4 to 5 times.',
    ],
    tips: ['If your shoulders rise, the breath is high. Let them drop and start again.'],
    duration: { short: 60, full: 120 },
    animation: 'low-breathing',
    links: [],
  },
  {
    id: 'straw',
    name: 'Straw phonation',
    purpose: 'Back-pressure from the straw lets the vocal folds vibrate with the least effort.',
    cues: [
      'Thin stirring straw between the lips. No air leaking around it.',
      'Hum gently through the straw on a comfortable pitch.',
      'Slow sirens through the straw: low to high to low, smooth.',
      'Finish by “speaking” a sentence or humming a tune through it.',
    ],
    tips: ['Never push. If it feels like effort, blow softer.'],
    duration: { short: 90, full: 180 },
    animation: 'straw',
    links: [
      { label: 'Ingo Titze straw phonation demo (NCVS archive)', url: 'https://archive.ncvs.org/videos.html' },
      {
        label: 'Titze: introduction to straw phonation (PDF)',
        url: 'https://www.vocology.utah.edu/_resources/documents/intro_a_video_straw_phonation_titze.pdf',
      },
      {
        label: 'The Science Behind the Straw Exercise (YouTube search)',
        url: 'https://www.youtube.com/results?search_query=the+science+behind+the+straw+exercise',
      },
    ],
  },
  {
    id: 'lip-trills',
    name: 'Lip trills',
    purpose: 'Loosens the lips and jaw and gets the voice going on gentle, steady airflow.',
    cues: [
      'Loose lips, not pursed. Blow gently until they buzz. No voice yet.',
      'Add voice: “brrr” on one easy pitch.',
      'Glide low to high, then high to low.',
      'Add a vowel on the end: “brrr-ah”. Then a word.',
    ],
    tips: ['Lips won’t trill? Press your cheeks lightly with two fingertips to take the weight off.'],
    duration: { short: 90, full: 180 },
    animation: 'lip-trills',
    links: [
      { label: 'Cambridge University Hospitals: lip trills handout', url: 'https://www.cuh.nhs.uk/patient-information/lip-trills-exercises/' },
      {
        label: 'Royal Berkshire NHS: humming and lip trills (PDF)',
        url: 'https://royalberkshire.nhs.uk/media/5fvclpqw/reducing-vocal-tension-using-humming-exercises-and-lip-trills_mar24.pdf',
      },
      { label: 'Royal Berkshire NHS demo video', url: 'https://youtu.be/LSbmqhPvW60' },
      { label: 'Vinh Giang: 3 exercises to deepen your voice (lip trills at 2:59)', url: 'https://www.youtube.com/watch?v=HT9_VxN8iSE&t=179s' },
    ],
  },
  {
    id: 'sirens',
    name: 'Sirens',
    purpose: 'Stretches the whole range so the speaking voice has room to move.',
    cues: [
      'Hum or “oo”. Glide from the bottom of your range to the top and back.',
      'Smooth and unforced, like a distant siren.',
      'Nudge gently past the comfortable edges on each pass.',
    ],
    duration: { short: 60, full: 120 },
    animation: 'sirens',
    links: [
      { label: 'Vinh Giang: siren at 0:54', url: 'https://www.youtube.com/watch?v=HT9_VxN8iSE&t=54s' },
      { label: 'Vinh Giang: how to make your voice sound deeper', url: 'https://vinhgiang.com/blog/how-to-make-your-voice-sound-deeper' },
    ],
  },
  {
    id: 'roger-love',
    name: 'Roger Love warmup',
    purpose: 'The guided scales. Follow the track.',
    cues: ['Press play and follow the guide vocal.', 'Stay easy. Never push for volume or range.'],
    duration: { short: 0, full: 836 },
    animation: null,
    kind: 'audio',
    audioSrc: AUDIO_BASE + 'roger-love-daily-warmup-male.mp3',
    links: [],
  },
  {
    id: 'hum',
    name: 'Hum into words',
    purpose: 'Brings the buzz forward into the face and carries it into speech.',
    cues: [
      '“Mmm” with lips closed. Feel the buzz in the lips and nose, not pressure in the throat.',
      '“Mmm-ah”. Keep the buzz as the mouth opens.',
      '“Mmm-many”, “mmm-money”. Same forward, easy feel.',
      'Short phrases with the same quality. This is the speaking voice now.',
    ],
    duration: { short: 60, full: 120 },
    animation: 'hum',
    links: [
      {
        label: 'Royal Berkshire NHS handout, exercises 3a to 3e (PDF)',
        url: 'https://royalberkshire.nhs.uk/media/5fvclpqw/reducing-vocal-tension-using-humming-exercises-and-lip-trills_mar24.pdf',
      },
    ],
  },
  {
    id: 'vfe',
    name: 'Vocal function exercises',
    purpose: 'Stemple’s four steps. Builds strength and efficiency; the sustain time is the progress metric.',
    cues: [
      'Warm up: soft nasal “ee” on a comfortable mid pitch, as long as you can. Twice.',
      'Stretch: glide low to high on “knoll”. Twice.',
      'Contract: glide high to low on “knoll”. Twice.',
      'Adduction: sustain “ol” softly on five successive pitches. Twice each.',
    ],
    tips: ['Time the sustains. Longer over weeks means a stronger, more efficient voice.'],
    duration: { short: 0, full: 240 },
    animation: 'vfe',
    panel: 'sustain',
    links: [
      { label: 'Step-by-step guide (Adult Speech Therapy Workbook)', url: 'https://theadultspeechtherapyworkbook.com/vocal-function-exercises/' },
      {
        label: 'Stemple’s course on MedBridge (clinician-oriented)',
        url: 'https://www.medbridge.com/course-catalog/details/vocal-function-exercises-joseph-stemple-speech-langauge-pathology-vocal-therapy',
      },
    ],
  },
  {
    id: 'read-aloud',
    name: 'Pitch-variety read-aloud',
    purpose: 'Breaks the monotone habit by over-practising movement, then dialling it back.',
    cues: [
      'Read the paragraph once completely over the top. Exaggerate every rise and fall.',
      'Read it again at 70 percent. Keep the movement, lose the parody.',
      'Notice which words carry the pitch moves. Those are the ones that land.',
    ],
    duration: { short: 0, full: 120 },
    animation: 'read-aloud',
    panel: 'reading',
    links: [{ label: 'Vinh Giang: how to become more articulate', url: 'https://vinhgiang.com/blog/how-to-become-more-articulate' }],
  },
];

export function exerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}
