# Setup: Google Cloud, GitHub, local dev

A refresher you can follow top to bottom on the Mac (Apple silicon, zsh). Takes about 45 minutes. Values in `<angle brackets>` are yours to fill in.

Choices made here:

- **New GCP project** for this repo (not `bpproject-504300`), so billing, permissions and the portfolio link stay separate.
- **Service account + JSON key** for auth, the same route that worked for bp_project. `gcloud auth application-default login` with the Drive scope tends to hit Google's "app is blocked" screen, and dbt needs Drive access to read the Sheet.
- **Datasets in `US`**: `curb_raw` (external tables), `curb_dev` (your dev builds), `curb_prod` (what the website reads).

---

## Part A — Google Cloud (step 3)

### A1. Create the project and turn on billing

1. Go to https://console.cloud.google.com → project picker (top bar) → **New project**.
2. Name: `curb-mishaps`. Note the **Project ID** it generates (e.g. `curb-mishaps-482913`). That ID is `<PROJECT_ID>` below.
3. **Billing → Link a billing account.** Don't skip this: without billing the project runs in the BigQuery sandbox, where tables expire after 60 days and the live site would break. This project's data is tiny, so it stays inside the free tier (1 TB of queries and 10 GB of storage a month).
4. **Billing → Budgets & alerts → Create budget**: $5/month, alerts at 50/90/100%. A safety net for a runaway query.

### A2. Point gcloud at the new project

dbt itself doesn't use this (it connects with the service account key). It matters for the `gcloud` and `bq` commands below: gcloud has one active project for the whole Mac, currently `bpproject-504300`, so without switching, `bq mk` would create the datasets in the wrong project. A named configuration makes the switch one command each way.

```bash
gcloud config configurations list                    # you'll see your existing one
gcloud config configurations create curb             # creates and activates "curb"
gcloud auth login --enable-gdrive-access             # Drive access lets `bq query` read the Sheet table too
gcloud config set project <PROJECT_ID>
gcloud config set compute/region us-central1

# later, to switch back:  gcloud config configurations activate default
```

### A3. Enable the APIs

```bash
gcloud services enable bigquery.googleapis.com drive.googleapis.com sheets.googleapis.com
```

### A4. Create the datasets

```bash
bq --location=US mk --dataset --description "External tables over the Google Sheet" <PROJECT_ID>:curb_raw
bq --location=US mk --dataset --description "dbt dev builds"                         <PROJECT_ID>:curb_dev
bq --location=US mk --dataset --description "dbt prod builds, read by the website"   <PROJECT_ID>:curb_prod
bq ls                                                # should list all three
```

### A5. Create the dbt service account and its key

```bash
gcloud iam service-accounts create dbt-curb --display-name "dbt for curb-mishaps"

SA="dbt-curb@<PROJECT_ID>.iam.gserviceaccount.com"
gcloud projects add-iam-policy-binding <PROJECT_ID> --member "serviceAccount:$SA" --role roles/bigquery.dataEditor
gcloud projects add-iam-policy-binding <PROJECT_ID> --member "serviceAccount:$SA" --role roles/bigquery.jobUser

mkdir -p ~/.gcp && chmod 700 ~/.gcp
gcloud iam service-accounts keys create ~/.gcp/curb-dbt-sa.json --iam-account "$SA"
chmod 600 ~/.gcp/curb-dbt-sa.json
```

`dataEditor` lets dbt create tables and views; `jobUser` lets it run queries. Nothing broader is needed.

### A6. Share the Sheet with the service account

Open the master Sheet → **Share** → paste `dbt-curb@<PROJECT_ID>.iam.gserviceaccount.com` → **Viewer** → untick "Notify people" → Share.

This is the step people forget. Without it every query on `curb_raw.mishaps` fails with *Permission denied while getting Drive credentials*.

### A7. Environment variables

Add to `~/.zshrc`, then `source ~/.zshrc`:

```bash
export CURB_GCP_PROJECT="<PROJECT_ID>"
export CURB_GCP_KEYFILE="$HOME/.gcp/curb-dbt-sa.json"
```

---

## Part B — GitHub repo and local dev (step 4)

### B1. Create the repo on GitHub

On github.com → **New repository**: name `curb-mishaps`, **Public** (it's a portfolio piece; nothing secret will be in it) or Private for now, and **leave "Add a README" unticked** so the first push doesn't conflict.

Or from the terminal, if you have the GitHub CLI:

```bash
gh repo create curb-mishaps --public --description "Larry David's mishap losses, built on the dbt semantic layer"
```

### B2. Clone it and add the starter kit

```bash
cd ~/fullstack_academy                       # same parent folder as bp_project
git clone https://github.com/<your-username>/curb-mishaps.git
cd curb-mishaps
# unzip the starter kit Claude sent into this folder, so dbt_project.yml sits at the repo root
unzip ~/Downloads/curb-mishaps-starter.zip -d /tmp/curb-kit && cp -R /tmp/curb-kit/curb-mishaps/. .
ls -a                                        # dbt_project.yml, CLAUDE.md, .gitignore, .sqlfluff, models/ ...
```

Also copy `PROJECT_BRIEF.md` and `losses_by_year_mockup.md` into `docs/` (an updated brief is in the kit already).

### B3. Python environment

MetricFlow needs Python 3.12 or 3.13 (not 3.15+).

```bash
brew install python@3.12                     # skip if `python3.12 --version` already works
python3.12 -m venv .venv
source .venv/bin/activate                    # prompt shows (.venv); do this every new terminal
pip install --upgrade pip
pip install -r requirements.txt              # dbt-core, dbt-bigquery, MetricFlow, SQLFluff
pip freeze > requirements.lock               # pin what you got, commit it
dbt --version && mf --version && sqlfluff --version
```

dbt may print a notice that "dbt v2 is available". Ignore it for now: `pip` installs dbt Core v1, which is what `dbt-metricflow` is built against.

### B4. dbt profile

Keep the connection inside the repo. dbt looks for `profiles.yml` in the folder you run it from before it falls back to `~/.dbt/`, so a copy at the repo root is all this project uses, and bp_project's `~/.dbt/profiles.yml` is never touched.

```bash
cp profiles.example.yml profiles.yml         # gitignored; holds no secrets (key path comes from $CURB_GCP_KEYFILE)
dbt debug          # every line should say OK, ending in "All checks passed!"
dbt deps           # installs dbt_utils and dbt_external_tables into dbt_packages/
```

`dbt debug` prints the profiles.yml path it used; it should be the repo root. If it fails on the connection: check `echo $CURB_GCP_KEYFILE` points at the key, and that the project ID in `$CURB_GCP_PROJECT` is the ID, not the display name.

### B5. SQLFluff

```bash
sqlfluff lint models/
```

The `.sqlfluff` file uses the dbt templater (BigQuery dialect, lowercase, trailing commas), so it needs `dbt debug` passing first (it reads the same repo-root profile). For VS Code, install the **sqlfluff** extension (dorzey.vscode-sqlfluff) and set its executable path to `.venv/bin/sqlfluff`.

### B6. First commit

```bash
git status                                   # confirm no .json key, no profiles.yml, no .venv
git add .
git commit -m "scaffold dbt project: external Sheet source, net worth seed, staging"
git push -u origin main
```

From here on: branch per task (`git switch -c feat/fct-mishap`), PR, merge.

---

## Part C — First data in the warehouse (step 6)

```bash
dbt run-operation stage_external_sources     # creates curb_raw.mishaps over the Sheet
dbt seed                                     # loads curb_dev.ld_net_worth_cpi
dbt build -s staging dim_date                # staging models, the calendar + tests
```

Check it landed:

```bash
bq query --use_legacy_sql=false \
  'select count(*) as row_count, countif(review_status = "keep") as kept from `curb_dev.stg_mishaps`'
# expect 195 rows total (as of 2026-11-19); S12 episodes 3-10 stay out of fct_mishap until you review them
```

If a test fails, read which one: `accepted_values` failures usually mean a typo in the Sheet (e.g. a new `source` value or review status), which is the test doing its job.
