import type { Exercise } from './types';

const AUDIO_BASE = import.meta.env.BASE_URL + 'audio/';

/** The routine, in order. */
export const exercises: Exercise[] = [
  {
    id: 'low-breathing',
    name: 'Low breathing',
    purpose: 'Puts the breath under the voice so the throat does not have to work.',
    subSteps: [
      { text: 'One hand on your belly, one on your chest. Shoulders down.', weight: 0 },
      {
        text: 'In through the nose for 4. The belly hand moves, the chest hand stays still. Let it fall out and try it a few times.',
        window: [0, 1 / 3],
      },
      { text: 'Full cycle: in for 4, out on a steady “sss” for 8. Keep repeating.', weight: 3, repSec: 12 },
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
    subSteps: [
      { text: 'Thin stirring straw between the lips. No air leaking around it.', weight: 0, window: [0, 0.12] },
      { text: 'Hum gently through the straw on a comfortable pitch.', window: [0.12, 0.3] },
      { text: 'Slow sirens through the straw: low to high to low, smooth.', weight: 2, window: [0.3, 0.7] },
      { text: '“Speak” a sentence or hum a tune through it.', window: [0.7, 1] },
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
    subSteps: [
      { text: 'Loose lips, not pursed. Blow gently until they buzz. No voice yet.', window: [0, 0.2] },
      { text: 'Add voice: “brrr” on one easy pitch.', window: [0.2, 0.4] },
      { text: 'Glide low to high, then high to low.', weight: 2, window: [0.4, 0.8] },
      { text: 'Add a vowel on the end: “brrr-ah”. Then a word.', window: [0.8, 1] },
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
    subSteps: [
      {
        text: 'Hum or “oo”. Glide from the bottom of your range to the top and back, smooth like a distant siren.',
        weight: 2,
      },
      { text: 'Nudge gently past the comfortable edges on each pass.' },
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
    subSteps: [],
    tips: ['Press play and follow the guide vocal.', 'Stay easy. Never push for volume or range.'],
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
    subSteps: [
      { text: '“Mmm” with lips closed. Feel the buzz in the lips and nose, not pressure in the throat.', window: [0, 0.3] },
      { text: '“Mmm-ah”. Keep the buzz as the mouth opens.', window: [0.3, 0.55] },
      { text: '“Mmm-many”, “mmm-money”. Same forward, easy feel.', window: [0.55, 0.8] },
      { text: 'Short phrases with the same quality. This is the speaking voice now.', window: [0.8, 1] },
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
    subSteps: [
      {
        text: 'Warm up: soft nasal “ee” on a comfortable mid pitch, as long as you can. Twice.',
        reps: 2,
        window: [0, 0.25],
      },
      { text: 'Stretch: glide low to high on “knoll”. Twice.', reps: 2, window: [0.25, 0.45] },
      { text: 'Contract: glide high to low on “knoll”. Twice.', reps: 2, window: [0.45, 0.65] },
      {
        text: 'Adduction: sustain “ol” softly on five successive pitches. Twice each.',
        reps: 10,
        repsPerPitch: 2,
        window: [0.65, 1],
      },
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
    subSteps: [
      { text: 'Read it once completely over the top. Exaggerate every rise and fall.', window: [0, 0.5] },
      { text: 'Read it again at 70 percent. Keep the movement, lose the parody.', window: [0.5, 1] },
      { text: 'Notice which words carry the pitch moves. Those are the ones that land.', weight: 0 },
    ],
    duration: { short: 0, full: 120 },
    animation: 'read-aloud',
    panel: 'reading',
    links: [{ label: 'Vinh Giang: how to become more articulate', url: 'https://vinhgiang.com/blog/how-to-become-more-articulate' }],
  },
];
