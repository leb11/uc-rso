# UC-RSO Website: Handover Guide

This guide is written for people who are **not programmers**. Part 1 is for every staff member, Part 2 is for the website maintainer, and Part 3 is for the IT office.

## What is this website?
A website for UC-RSO that shows our projects, news and events, partners, photos, and a video. Visitors can send us a message. Staff can post updates themselves without touching any code.

## Who does what
| Role | Who | What they do |
|---|---|---|
| Staff | All RSO employees | Post news, add projects, read messages (Part 1) |
| Maintainer | 1 or 2 named employees | Change text, partners, photos, logo, and the password (Part 2) |
| IT office | UC IT | Hosts the site, HTTPS, backups, updates (Part 3) |

Fill this in at handover: Maintainer 1: ________  Maintainer 2: ________  IT contact: ________

---
## Part 1: Staff guide (no coding)
**Log in:** go to `your-website-address/admin.html`, type the staff password, and click **Log in**.

**Post news or an event**
1. In "Post news or an event", type a **Title**.
2. Choose a **Type**: *Hosted* (we organized it), *Attended* (we went), or *Participated* (we took part).
3. Pick the **Date**, write a short **Summary** (2 to 3 sentences), and add a **Photo** if you have one (under 4 MB).
4. Click **Publish news**. It appears on the website right away.

**Add a project:** same steps in "Add a project". Choose **Ongoing** or **Completed**. When a project ends, delete it and add it again as Completed.

**Delete a post:** click **Delete** beside it and confirm. This cannot be undone.

**Read messages:** they are listed at the bottom of the page, newest first. Reply from your normal email, because the site does not send replies.

**Tips:** use clear titles, keep photos landscape (wide), never post private information, and log out by closing the tab.

---
## Part 2: Maintainer guide
You only need **VS Code** and the project folder. Never edit files you do not recognize.

**Start the site on your computer:** open the folder in VS Code, press **F5** (or type `npm start` in the terminal), then open http://localhost:3000. Stop it with Ctrl+C.

**Change text, services, partners, photos**
| I want to change… | Open this file | How |
|---|---|---|
| Phone, email, office, address, headline | `public/data/site.json` | Edit the text between the quotes |
| The six services | `public/data/services.json` | Edit `title` and `text`. Keep the commas and quotes |
| Partners list | `public/data/partners.json` | Add a line like `"New Partner Name",` |
| Gallery photos | `public/data/gallery.json` | Copy the photo into `public/images/`, then add `{"image": "myphoto.jpg", "caption": "What it shows"}` |
| Logo | `public/images/logo.png` | Replace the file, keeping the same name |
| Video | `public/video/teaser.mp4` | Replace the file, keeping the same name |
| Colors | top of `public/css/style.css` | Change the values after `--g:`, `--g2:`, `--gold:` |

**Safe editing rules:** (1) change only the words between quotes, (2) every item except the last ends with a comma, (3) save, refresh the browser, and check. If it breaks, press **Ctrl+Z** or use Git to go back (below).

**Change the staff password:** edit the `.env` file (copy `.env.example` if it is missing), change `ADMIN_PASSWORD`, and restart the server. Change it whenever someone leaves the office.

**Photo tip:** resize photos to about 1200 pixels wide before adding them so the site stays fast.

---
## Part 3: IT office notes
- Needs **Node.js 20+**. Start with `npm start`, or run it as a service (PM2 or a Windows service) so it restarts after a reboot.
- Set `ADMIN_PASSWORD` in `.env`. Put the site behind **HTTPS** (nginx, IIS, or similar). Set `PORT` if 3000 is taken.
- To send staff replies from the site, ask UC IT for an approved SMTP relay or office-mailbox app password and set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM` in `.env`. Never use a visitor's email password; visitors only need to enter an email address where they can receive a reply.
- **Back up** the `data/` folder and `public/images/uploads/` regularly. They hold the live news, projects, messages, and uploaded photos.
- To update the site: `git pull`, then restart the server. Live content is not stored in git, so updates never erase news or messages.
- Staff share one password. Separate logins and email notifications for new messages can be added later.

---
## Using GitHub (recommended)
**Why:** GitHub keeps every version of the code, so mistakes can be undone and handover is simple: a new maintainer gets the whole project with one click.

**Set up once (maintainer)**
1. Make a free account at github.com. Ask UC to create an **organization** (for example "UC-RSO") so the project belongs to the office, not one person.
2. Click **New repository**, name it `uc-rso-website`, and choose **Private**. Do not tick "add README".
3. Install **GitHub Desktop**, choose *Add an Existing Repository*, select this folder, and click **Publish repository** (keep "Keep this code private" ticked).
4. In GitHub, open **Settings > Collaborators** (or Teams) and invite the other maintainers.

**Everyday changes:** edit the files > open GitHub Desktop > write a short summary (for example "Added new partner") > **Commit to main** > **Push origin**. To undo a mistake, right-click the commit in the History tab and choose **Revert**.

**Never upload:** the `.env` file or the `data/` folder. They are already blocked by `.gitignore`.

---
## Handover checklist
- [ ] Maintainers and IT contact written in the table at the top
- [ ] GitHub organization created, repository private, maintainers invited
- [ ] New staff password set in `.env` and stored in the office password manager
- [ ] Each maintainer has run the site on their own computer
- [ ] IT has the hosting, HTTPS, and backup plan
- [ ] Sample news and project text replaced with real content
- [ ] Logo and office name confirmed

## If something goes wrong
| Problem | What to do |
|---|---|
| Page shows "server may not be running" | Start the server (`npm start`) |
| Cannot log in | Check `ADMIN_PASSWORD` in `.env`, restart, and wait 10 minutes if you tried 5 times |
| Edited a JSON file and the section is empty | A comma or quote is missing. Undo with Ctrl+Z |
| Photo does not show | The file name in `gallery.json` must match the file in `public/images/` exactly |
| Messages are missing | Check that the `data/` folder was not deleted or moved |
