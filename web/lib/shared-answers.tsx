// Answers that appear on both Future Flops ("The Numbers Explained") and Pretty, Pretty, Pretty
// Good Answers, written once here so the two pages can't drift apart. Copy only: any figure is
// passed in by the page, which picks it from the exported metrics.

/** "Did Larry get more or less unlucky over the years?" */
export const UNLUCKY = {
  question: "Did Larry get more or less unlucky over the years?",
  answer: (
    <p>
      No. Season by season, neither how often mishaps happen nor what they cost (with inflation taken out)
      changed by more than luck would explain, so the early seasons count just as much as the recent ones.
    </p>
  ),
};

/** "Why does Season 14 cost a little more than Season 13?" */
export const SEASON_14_COSTS_MORE = {
  question: "Why does Season 14 cost a little more than Season 13?",
  answer: (
    <p>
      The price of the mishaps. Both come out of the same hat, so they&apos;d cost the same in the same
      year&apos;s money. Season 13 is shown in 2025 dollars and Season 14 in 2026 dollars, and prices rose
      about 3% in between.
    </p>
  ),
};

/** Where the catastrophe chance comes from, and why the show's divorce is left out. `chance` is
    the forecast's catastrophe chance, already formatted (and styled, if the page wants). */
export function CatastropheChance({ chance }: { chance: React.ReactNode }) {
  return (
    <p>
      Two of the 12 real seasons had one, the house fire and Latte Larry&apos;s burning down, so the chance
      is {chance} a season. The show&apos;s divorce from Cheryl is left out. It only happens once, and Larry
      ends the series unmarried.
    </p>
  );
}
