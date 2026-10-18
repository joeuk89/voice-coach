export interface Passage {
  /** The passage's opening clause, marked the same way, drawn as the card's pitch contour. */
  demo: string;
  text: string;
}

/**
 * Short passages for the pitch-variety read-aloud. Words wrapped in *asterisks* are shown
 * bold as a nudge to lift the pitch there; about one per clause. Add as many as you like;
 * the app rotates through them by day and the "New passage" button steps on.
 */
export const paragraphs: Passage[] = [
  {
    demo: 'I *wasn’t* going to *say* anything',
    text: 'I *wasn’t* going to *say* anything, *honestly*. But then she asked me, in front of *everyone*, whether I had *actually* read the report. Of *course* I’d read it. I’d read it *twice*. What I *hadn’t* done was understand a *single* word of it, and *that*, it turned out, was the *real* question.',
  },
  {
    demo: 'There are *two* kinds of *people*',
    text: 'There are *two* kinds of *people* at a train station. The ones who arrive *twenty* minutes *early* and stand *exactly* where the doors will open, and the ones who are *sprinting* down the platform as the *whistle* goes. I have been *both*. I *know* which one gets the *good* seat.',
  },
  {
    demo: 'Here’s the *thing* about *mornings*',
    text: 'Here’s the *thing* about *mornings*. Nobody *likes* them, not *really*. The ones who *claim* to are simply the people who went to bed at a *sensible* hour, and I *refuse* to let them take the *credit* for that. It isn’t *virtue*. It’s *scheduling*.',
  },
  {
    demo: 'The *recipe* said *simmer* gently',
    text: 'The *recipe* said *simmer* gently. What I *did* was walk away, answer *one* email, and come back to something that could *reasonably* be described as *charcoal*. The smoke *alarm* agreed. The *neighbours*, I suspect, agreed *too*. Dinner, in the end, was *toast*. *Excellent* toast, though.',
  },
  {
    demo: '*Picture* the room. *Forty* people',
    text: '*Picture* the room. *Forty* people, *one* projector, and a slide that says, in letters a *foot* high, *Any* questions? *Silence*. Not *thoughtful* silence. The *other* kind. And then, from the *back*, one hand goes up, and a voice says: could you go back to the *beginning*?',
  },
  {
    demo: 'My *grandfather* had a *rule*',
    text: 'My *grandfather* had a *rule* about tools. You could borrow *anything*, as long as you brought it back *cleaner* than you found it. For *years* I thought this was about the *tools*. It *wasn’t*. It was about *you*, and whether he could *trust* you with the *bigger* things later.',
  },
];

/** Whole local days since 1 January 1970, so the passage changes at local midnight. */
function dayNumber(d: Date): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / 86_400_000);
}

/** Where today's passage sits in `paragraphs`: one step on each local day, round and round. */
export function todaysPassageIndex(date = new Date()): number {
  return dayNumber(date) % paragraphs.length;
}

/** The passage the read-aloud opens on today. */
export function todaysPassage(date = new Date()): Passage {
  // The index is always inside the list, which is never empty.
  return paragraphs[todaysPassageIndex(date)]!;
}
