# NAEP Atlas social media kit

Site: https://reportcard.neverlost.studio

Every number below comes from the Atlas's own data (NAEP Data Service, NCES) and its
significance test. A few borderline results can differ from the official NAEP Data
Explorer, so check there before quoting a specific state in a formal setting.

## Images

| File | Size | Use for |
|---|---|---|
| `og-link-card-1200x630.png` | 1200×630 | Link preview on X, LinkedIn, Facebook, Bluesky, Slack, iMessage. Also installed in the site as `frontend/public/og.png`. |
| `square-launch-1080.png` | 1080×1080 | Launch post, any platform |
| `square-pandemic-drop-1080.png` | 1080×1080 | "50 of 51" finding |
| `square-rank-range-1080.png` | 1080×1080 | Rank range explainer |
| `square-mississippi-1080.png` | 1080×1080 | Mississippi reading story |
| `portrait-launch-1080x1350.png` | 1080×1350 | Instagram and LinkedIn feed (takes more screen) |
| `story-launch-1080x1920.png` | 1080×1920 | Instagram / Facebook stories, TikTok, Shorts cover |
| `banner-1500x500.png` | 1500×500 | X header. Crop the center for LinkedIn (1584×396). |
| `avatar-800.png` | 800×800 | Profile picture (safe inside a circle crop) |

## Profile text

**Name:** NAEP Atlas

**Bio (under 160 characters):**
State results from the Nation's Report Card, 1990–2024, with the margins of error. Free. A NeverLost Studio project.

**One-liner:**
State test scores, with the margin of error.

## Post 1: launch

Image: `square-launch-1080.png` or `portrait-launch-1080x1350.png`

**Short (X, Bluesky, Threads):**

> Which states really beat the national average?
>
> NAEP Atlas maps every state's Nation's Report Card results from 1990 to 2024, and only colors a difference when it's statistically significant.
>
> Free, no sign-in.
> reportcard.neverlost.studio

**Long (LinkedIn, Facebook):**

> State rankings on the Nation's Report Card get quoted as if 12th and 20th were different places. Often they aren't: NAEP is a sample, every score has a margin of error, and many states can't be told apart.
>
> I built NAEP Atlas to show that plainly. It covers grade 4 and grade 8 reading and math for every state from 1990 through 2024, using the official NCES data, and it tests every comparison:
>
> • a map that colors a state only when it differs significantly from the nation
> • change between any two years, with the significant changes marked
> • rank ranges instead of single ranks
> • a time-lapse of all 30+ years
>
> It's free and there's no sign-in.
> https://reportcard.neverlost.studio

**Alt text:** Map of the United States titled "Which states really beat the national average?" for grade 8 math in 2024. States are teal where they scored significantly above the nation, purple where significantly below, and gray where not significantly different.

## Post 2: the pandemic drop

Image: `square-pandemic-drop-1080.png`

**Short:**

> 50 of 51.
>
> That's how many states (plus DC) scored significantly lower in grade 8 math in 2022 than in 2019. Utah was the exception.
>
> Two years later, not one has posted a significant gain.
> reportcard.neverlost.studio

**Long:**

> Between 2019 and 2022, grade 8 math scores fell significantly in 50 of 51 states and DC. Only Utah's change was within the margin of error.
>
> The 2024 results didn't undo it. No state gained significantly between 2022 and 2024, and 50 of 51 are still significantly below where they were in 2019 (Tennessee is now the exception).
>
> Grade 4 math looks better: 14 states gained significantly since 2022. But only one, Alabama, is significantly above its 2019 score.
>
> You can pick any two years and any of the four tests here:
> https://reportcard.neverlost.studio/?a=math-8&t=change

**Alt text:** Large text reading "50 of 51 states scored significantly lower in grade 8 math in 2022 than in 2019." Below it, a US map shaded purple by the size of each state's decline, with Utah the only faded state.

## Post 3: rank ranges

Image: `square-rank-range-1080.png`

**Short:**

> Kentucky ranked 28th in grade 8 math in 2024.
>
> Or 24th. Or 40th. Its score can't be statistically separated from 16 other states.
>
> NAEP Atlas shows the range, because a single rank claims more than the data can.
> reportcard.neverlost.studio

**Long:**

> "We're ranked 28th" sounds exact. It isn't.
>
> Kentucky's 2024 grade 8 math score puts it 28th by raw average. But 16 other states have scores that can't be statistically distinguished from Kentucky's, so its honest position is somewhere between 24th and 40th.
>
> That's true of most states in most years. NAEP Atlas reports a rank range for every state: the best and worst place it could hold given which differences are actually significant.
>
> https://reportcard.neverlost.studio/?a=math-8&y=2024&s=KY&t=rankings

**Alt text:** Headline "Ranked 28th. Or 24th. Or 40th." above a chart of all 51 state scores for grade 8 math in 2024, each with a 95 percent confidence interval. Kentucky is highlighted, and a shaded band covers the 16 states whose scores are not significantly different from it.

## Post 4: Mississippi

Image: `square-mississippi-1080.png`

**Short:**

> Mississippi, grade 4 reading:
>
> 1992: 16 points below the nation
> 2024: 4 points above it, a statistically significant lead
>
> The whole trend line, with its margin of error:
> reportcard.neverlost.studio

**Long:**

> In 1992, Mississippi's fourth graders scored 16 points below the national average in reading. In 2024 they scored 4 points above it, and that lead is statistically significant.
>
> Most of the climb came between 2013 and 2019, when the state gained about 11 points while the nation was flat.
>
> One caution when reading the early years: before 1998, NAEP reading didn't allow testing accommodations, so the 1992 and 1994 results come from a slightly different sample. The Atlas marks those years.
>
> https://reportcard.neverlost.studio/?a=reading-4&y=2024&s=MS&t=map

**Alt text:** Line chart of Mississippi's grade 4 reading score from 1992 to 2024 with a shaded confidence band, rising from about 199 to 219. A dashed national line starts well above Mississippi and ends below it at 214.

## More post ideas (no image yet)

- **Grade 4 reading since 2019:** 40 of 51 states are significantly lower in 2024 than in 2019. Louisiana is the only state significantly higher.
- **Who took part:** only 38 jurisdictions took the first state-level grade 8 math test in 1990. Every state has taken part since 2003.
- **Your state:** share a link that opens on one state, for example `https://reportcard.neverlost.studio/?a=reading-4&y=2024&s=TX&t=map` (change `TX` to any state code).

## Hashtags

Use two or three at most: `#NAEP` `#NationsReportCard` `#EdData` `#K12` `#DataViz`

## Tags and credit

Data: National Center for Education Statistics (NCES), NAEP Data Service.
Built by Michael Shouse, PhD · NeverLost Studio.
