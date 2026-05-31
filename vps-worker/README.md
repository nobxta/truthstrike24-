# TruthStrike24 — VPS Worker

A tiny Node.js script that generates news articles on a VPS (no Vercel timeout limits).

## Why?

Vercel Hobby plan has a **10-second function timeout**. Full-quality articles with `web_search` + `Claude Sonnet` + `FLUX dev` images take 30-60 seconds. A $4 VPS solves this — runs the same code with no timeout.

## Architecture

```
Vercel (website)  ──┐
                    ├──> Same Neon DB
VPS (worker)      ──┘
```

Both Vercel and the VPS write to the **same database**. The website on Vercel just reads and displays posts.

## Quick Setup

### 1. Get a VPS

Best free option: **Oracle Cloud Always Free** (4 vCPU + 24GB RAM, free forever).
Easiest paid: **Hetzner CX22** (€4/mo) or **DigitalOcean Droplet** ($4/mo).

Pick **Ubuntu 22.04 LTS**.

### 2. SSH in & install Node.js 20

```bash
ssh root@YOUR_VPS_IP

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

# Verify
node -v   # should print v20.x.x
```

### 3. Clone repo & install

```bash
cd /opt
git clone https://github.com/nobxta/truthstrike24-.git
cd truthstrike24-/vps-worker

# Install dependencies (needs the main project's prisma schema)
cp ../prisma . -r
npm install
npx prisma generate
```

### 4. Configure environment

```bash
cp .env.example .env
nano .env
# Paste all your API keys + DATABASE_URL (same as Vercel)
# Save: Ctrl+O, Enter, Ctrl+X
```

### 5. Test it once

```bash
node --env-file=.env agent.js
```

You should see logs showing the article being generated and saved to the DB. Visit your Vercel site — the new post will be live within seconds (Next.js ISR or just refresh).

### 6. Run forever — pick ONE method

#### Method A: Built-in watch mode (simplest)

```bash
# Run every 60 minutes
nohup node --env-file=.env agent.js --watch --every=60 > worker.log 2>&1 &

# Check it's running
tail -f worker.log
```

This survives ssh disconnect (via `nohup`). To stop: `pkill -f "node.*agent.js"`.

#### Method B: systemd service (production, auto-restart)

Create `/etc/systemd/system/truthstrike-agent.service`:

```ini
[Unit]
Description=TruthStrike24 AI Agent Worker
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/truthstrike24-/vps-worker
EnvironmentFile=/opt/truthstrike24-/vps-worker/.env
ExecStart=/usr/bin/node agent.js --watch --every=60
Restart=always
RestartSec=10
StandardOutput=append:/var/log/truthstrike-agent.log
StandardError=append:/var/log/truthstrike-agent.log

[Install]
WantedBy=multi-user.target
```

Then:

```bash
systemctl daemon-reload
systemctl enable truthstrike-agent
systemctl start truthstrike-agent
systemctl status truthstrike-agent   # check it's running
tail -f /var/log/truthstrike-agent.log
```

#### Method C: Linux cron (simplest, no daemon)

```bash
crontab -e
```

Add this line:

```cron
0 * * * * cd /opt/truthstrike24-/vps-worker && node --env-file=.env agent.js >> /var/log/truthstrike-agent.log 2>&1
```

This runs every hour on the hour.

## What it does

1. Reads `AgentSettings` from Neon DB
2. Picks a random topic from `topicFocus`
3. Calls the configured AI provider (`postProvider` + `model`)
4. If `useWebSearch: true` and provider is Anthropic, uses Claude's web_search tool
5. Parses the JSON response
6. Calls WaveSpeed with the `imagePrompt`
7. Saves the post to DB with `featuredImage` URL
8. Logs to `AgentLog` and `AIUsage` tables

## Monitor

The Vercel admin panel at `/admin/agent-settings` shows usage stats — they include VPS runs because both write to the same DB.

You can also check the worker log:

```bash
tail -f worker.log          # if using watch mode
tail -f /var/log/truthstrike-agent.log   # if using systemd or cron
```

## Toggle on/off

You don't need to restart the worker to disable. Just flip the **Active** toggle on the Vercel admin settings page. The worker reads that flag every run and skips when disabled.

## Cost

- **VPS**: $0 (Oracle Free) to $5/mo
- **AI calls**: same as before (~$0.001 per article with Groq, ~$0.02 with Claude)
- **WaveSpeed images**: ~$0.003-0.04 per image
- **Total at hourly cron**: ~$0.50-15/month depending on models

## Troubleshooting

**"AgentSettings not found in DB"** → Run the Vercel admin panel once to seed the settings row.

**"AI returned invalid JSON"** → Switch to a stronger model (Claude Sonnet > Groq for JSON formatting).

**"WaveSpeed 401"** → Wrong API key. Regenerate at wavespeed.ai/dashboard.

**Worker dies after ssh disconnect** → You forgot `nohup`. Use systemd instead.

**Want to update the worker?**

```bash
cd /opt/truthstrike24-/vps-worker
git pull
npm install
systemctl restart truthstrike-agent   # if using systemd
```
