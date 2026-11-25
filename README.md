# Cookies & Cream — website

Static website for Cookies & Cream, 929 Elmwood Ave & 2114 Seneca St, Buffalo NY.
It's plain HTML, CSS and JavaScript, so it runs on GitHub Pages with no build step.

## Files

| File | What it is |
|---|---|
| `index.html` | Home page (newsletter popup, quick links, photos, addresses, gift cards) |
| `menu.html` | Menu with the five tabs |
| `order.html` | Delivery apps for each shop |
| `parties.html` | Party packages and the party request form |
| `classes.html` | Cookie decorating classes |
| `js/config.js` | **Where your forms send their data. This is the only file you need to edit to connect forms.** |
| `js/forms.js` | Sends the newsletter and party forms |
| `js/runtime.js` | Small script that draws each page and makes buttons and tabs work |
| `assets/photos/` | **Your photos go here.** `assets/photos/PHOTOS.md` lists every file name, page and shape |
| `assets/img/` | Logo and site images |

## Put it on GitHub Pages

1. Create a new repository on GitHub, for example `cookies-and-cream`.
2. Upload everything in this folder to the repository: on the repo page, **Add file → Upload files**, then drag in the folder contents. Include the hidden `.nojekyll` file.
3. Go to **Settings → Pages**. Under "Build and deployment", set Source to **Deploy from a branch**, Branch to **main**, folder **/ (root)**, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/cookies-and-cream/`.

**Custom domain (for example cookiesandcreambuffalo.com):** in Settings → Pages, type the domain under "Custom domain" and save. Then, at the company you bought the domain from, add the DNS records GitHub shows you. Tick **Enforce HTTPS** once it becomes available.

## Make the forms collect data

GitHub Pages only serves files and can't receive form submissions itself. The forms send to a form service instead: paste that service's address into `js/config.js`.

```js
window.CC_CONFIG = {
  newsletterEndpoint: "https://formspree.io/f/xxxxxxx",
  partyEndpoint:      "https://formspree.io/f/yyyyyyy"
};
```

If a line is left empty (`""`), that form only shows its thank-you message and nothing is sent.

What each form sends:

- **Newsletter popup** (home page): `email`
- **Party request** (Parties page): `name`, `email`, `phone`, `date`, `guests`, `package`, `location`

### Option A: Formspree (easiest, emails you each submission)

1. Sign up at formspree.io and create two forms: "Newsletter" and "Party requests".
2. Each form gets an address like `https://formspree.io/f/abcdwxyz`. Paste them into `js/config.js`.
3. Submissions arrive in your email and in the Formspree dashboard, where you can export them as a CSV.

The free plan has a monthly submission limit. Check Formspree's current pricing if you expect a lot of sign-ups. Basin and Getform work the same way: paste their form URL instead.

### Option B: Google Sheets (free, every submission becomes a row)

1. Create a Google Sheet. Name the first tab `Newsletter` and add a second tab `Parties`.
2. In the sheet: **Extensions → Apps Script**. Replace the code with:

```js
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (data.form === 'party') {
    ss.getSheetByName('Parties').appendRow([new Date(), data.name, data.email, data.phone, data.date, data.guests, data.package]);
    MailApp.sendEmail(Session.getActiveUser().getEmail(), 'New party request', JSON.stringify(data, null, 2));
  } else {
    ss.getSheetByName('Newsletter').appendRow([new Date(), data.email]);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy → New deployment → Web app**. Set "Execute as" to **Me** and "Who has access" to **Anyone**, then click Deploy and approve the permissions.
4. Copy the Web app URL (it ends in `/exec`) and paste it into **both** lines of `js/config.js`.

The site notices the Google address and sends the data in the format Apps Script accepts, so there's nothing else to change. Test one real submission and check that the row appears.

### Option C: an email marketing tool for the newsletter

If you use Mailchimp, Klaviyo or Square Marketing for your emails, use their own sign-up form address instead so new subscribers go straight onto your email list. Their help pages call it an "embedded form action URL".

## Payments and links still to fill in

These are links, not forms. Set them by editing the HTML (search for `href="#"`):

- **Parties page:** "Pay deposit with Square" (two places). Use a Square payment link from the Square Dashboard.
- **Home page:** "Buy a gift card". Use your Square eGift Card page link.
- **Classes page:** the three "Reserve" buttons. Use a Square Appointments link, or a Square payment link per class.
- **Order page:** each shop's DoorDash, Uber Eats and Grubhub links.

Also replace the remaining `[PRICE]`, `[Hours]`, `[Phone]` and `[Add detail]` placeholders, and add your photos: drop them into `assets/photos/` using the file names in `assets/photos/PHOTOS.md`. Each photo replaces its placeholder automatically.

## Editing later

The pages were built in Claude's design canvas, and that canvas is still the easiest place to make design changes. Ask Claude to rebuild this folder afterwards. Small text fixes can also be made directly in the `.html` files: the text sits inside the `<template id="page">` block.
