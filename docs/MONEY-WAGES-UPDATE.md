# Money, wages and answer progression

Development only, based on `release/ipad` at `e3550ec`. No merge, deployment, real learner/account access, database changes or hosting changes. Scope remains the existing skills, missions and question counts.

## Money and saved content

New shopping questions ask for pounds with two-decimal currency labels. Coin/note questions distinguish mixed amounts, pence-only coin counting and explicit conversions. Generated payment amounts use plausible UK notes. Monetary input accepts the requested symbol (`£4.50`, `50p`) and the corresponding bare number; an incompatible unit receives a conversion reminder.

All amounts in activity ledgers remain integer pence. New Town amount snapshots request pounds at entry; old snapshots keep their response format. Existing question/task IDs, saved snapshots, evidence, purchase records, learning coins and immutable cloud queues are preserved. No migration or regeneration of existing tasks occurs. The 50p allocation token is additive; 5p remains available. Allocation cannot exceed its fund. Returning tokens updates the fund.

Town balances distinguish starting purse cash, total current cash, cash outside envelopes, bank savings, travel and spending. Current allocation reduces the unallocated balance; confirmed allocations retain envelopes, and later expenses draw down the relevant cash envelope. The monthly payslip is explicitly separate from the existing short-shift exercises: those exercises keep their supplied gross/deduction/net amounts, including branched shifts and historical snapshots.

## Educational payslip, reviewed 8 November 2026

This is a bounded illustration, not a payroll calculator. Fictional employee Alex Morgan is 25, works in England, is paid monthly, uses cumulative code 1257L and NI category A, and is enrolled in a qualifying-earnings workplace pension with a net pay arrangement (not salary sacrifice). No student loan, other deductions, prior pay or prior tax in this tax year. Pay date 30 April 2026, tax month 1, tax year 6 April 2026 to 5 April 2027. Salary annualises 37.5 paid hours/week over 52 weeks into 12 equal monthly periods.

| Item | Calculation | Amount |
| --- | --- | --- |
| Monthly paid hours | 37.5 × 52 ÷ 12 | 162.5 |
| Gross | 162.5 × £12.71, nearest penny | £2,065.38 |
| Qualifying pension earnings | £2,065.38 − £520 (upper bound £4,189) | £1,545.38 |
| Employee pension | 5%, nearest penny | £77.27 |
| Pay after net pay pension | £2,065.38 − £77.27 | £1,988.11 |
| PAYE free pay, Tables A month 1 | code 257 £214.92 + two 500-code units of £416.67 | £1,048.26 |
| PAYE taxable pay | £1,988.11 − £1,048.26, discard pennies | £939 |
| PAYE, Tables B basic rate | £939 × 20% | £187.80 |
| Employee NI | (£2,065.38 − £1,048) × 8%, nearest penny, exact half penny down | £81.39 |
| Net | gross − employee pension − PAYE − employee NI | **£1,718.92** |
| Employer pension, separate | qualifying earnings × 3%, nearest penny | £46.36 |

The employer contribution is never subtracted from net pay. The annual Personal Allowance is £12,570; dividing that by 12 is not the PAYE tax-code table method. The implementation deliberately uses HMRC's published manual check method for this first-month example. Other periods, earnings histories, codes, pension arrangements or employee circumstances can produce different deductions, including zero.

The focused test's independent expected PAYE result comes from HMRC Tables A page 57 (month 1) and the 2026/27 Tables B–D instructions and basic-rate table. It checks literal expected pennies rather than calling the implementation twice. NI uses gross before net pay pension. The monthly PT/UEL are £1,048/£4,189 with 8%/2% category A rates. Pension qualifying limits are £520/£4,189 monthly with 5% employee and 3% employer contributions for this eligible member.

Official sources checked:

- [GOV.UK minimum wage rates](https://www.gov.uk/national-minimum-wage-rates): £12.71 for age 21+ from 1 April 2026.
- [HMRC 2026/27 rates and thresholds](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027): Personal Allowance, England basic rate and category A NI.
- [HMRC Tables A](https://www.gov.uk/government/publications/tables-a-pay-adjustment-tables), [month 1 PDF, page 57](https://assets.publishing.service.gov.uk/media/5c7fde8be5274a3f90f75580/Tables_A_Pay_adjustment.pdf).
- [HMRC 2026/27 taxable pay manual method](https://www.gov.uk/government/publications/taxable-pay-tables-manual-method), [Tables B–D PDF](https://assets.publishing.service.gov.uk/media/69a05a803e672177d0bc773f/Tax_Tables_B-D_2026_to_2027.pdf): whole-pound taxable pay and basic rate.
- [HMRC manual payroll checks](https://www.gov.uk/government/collections/how-to-manually-check-your-payroll-calculations).
- [HMRC net pay pension method](https://www.gov.uk/hmrc-internal-manuals/pensions-tax-manual/ptm044230): employee pension reduces taxable pay before PAYE.
- [The Pensions Regulator 2026/27 earnings thresholds](https://www.thepensionsregulator.gov.uk/en/employers/new-employers/im-an-employer-who-has-to-provide-a-pension/declare-your-compliance/ongoing-duties-for-employers/earnings-thresholds).
- [The Pensions Regulator minimum contributions](https://www.thepensionsregulator.gov.uk/employers/new-employers/im-an-employer-who-has-to-provide-a-pension/choose-a-pension-scheme/understanding-your-costs/making-contributions-to-your-pension-scheme).

For a new tax year, recheck the sources, update the dated illustration and calculation together, and independently recalculate the literal expected results. Do not relabel the old snapshot as a new tax-year example.

## Guidance and progression

New Town money tasks use money-specific teaching/examples. A display-only fallback also replaces the old generic grouping example on saved money tasks; their original task snapshots and answers remain unchanged. Learning advancement clears feedback, hint level, manipulation, teaching example and both maths-tool drafts. Task-based guidance continues to come from the current saved task.

A correct answer is persisted with its existing evidence before a 900ms live correctness announcement and automatic advancement. The existing next transition owns completion, rewards and ledger effects. The timer captures question/activity identity, checks it inside the existing save lock, and is cancelled on navigation. Reloading a saved answered question resumes the transition. Wrong answers stay for assisted retry. Unknown responses are captured as skipped, assisted evidence and progress using the worked fictional ledger values; they never become independently correct. Initial nine-area baseline assessment retains its existing assessment flow and scoring contract.

## Verification

See the final results below; all fixtures are fictional and external backend traffic is denied. Browser runs use Chromium desktop plus iPad portrait/landscape touch emulation. Physical iPad Safari remains untested.

- `npm test` passed, including the new focused money/payroll test in the normal baseline.
- `npm run test:curriculum` and `npm run test:touch` passed.
- Money browser matrix: 18 cases across desktop and both iPad orientations; additional close-up visibility, direct retry/advancement and baseline monetary parsing checks passed.
- Curriculum browser matrix: 81 passed; touch browser matrix: 57 passed. The direct grocery currency-label follow-up passed in all three touch layouts.
- Gameplay quality: offline suites plus all 48 browser cases passed, including completed journeys, choice branches, wage allocations, immutable saves and existing reward boundaries.
- iPad release gate: cloud/save recovery, release preflight, disposable local PostgreSQL receipt checks, Town and hands-on regressions, then all 14 intercepted browser cases passed.
- Additional targeted paused-check recovery (4 layouts) and family Town pause/switch/complete (iPad portrait) passed.

Earlier test assumptions that clicked a second Next button were updated to observe the automatic saved transition. Complete-journey testing caught and fixed a null-task guard in the new payslip display. Generated runtime screenshots/reports are kept out of the source change; the concise machine-readable summary is `tests/artifacts/money-wages-summary.json`.
