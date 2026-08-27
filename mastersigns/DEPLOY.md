# Deploying this site

Static HTML, CSS, JavaScript and media. **No build step, no dependencies, no
Node.** Whatever host you use, the whole job is: serve this folder as-is.

## Vercel (drag and drop — easiest)

1. Sign in at vercel.com and choose **Add New… → Project → Deploy**.
2. On the import screen pick the option to deploy without a Git repository,
   then drag this entire folder onto the drop zone.
3. When asked for a framework preset choose **Other**. Leave the build
   command and install command empty, and set the output directory to `.`
   (a single dot) or leave it blank.
4. Deploy. That is all — `vercel.json` in this folder already sets clean URLs
   and long-lived caching for `/assets`.

## Vercel (from the command line)

```
npm i -g vercel
cd mastersigns
vercel          # preview URL
vercel --prod   # production
```

## Vercel (from a Git repo)

If this folder lives inside a larger repository, connect the repo in Vercel
and set **Root Directory** to the folder that contains `index.html`. Leave
the framework as Other and the build command empty.

## Any other host

It works unchanged on Netlify (drag the folder onto the deploys page),
Cloudflare Pages, GitHub Pages, S3 + CloudFront, or ordinary shared hosting
via FTP. Upload the contents so that `index.html` sits at the web root.

## What is in here

```
index.html        Home
services.html     Services
work.html         Work
brief.html        Project brief (the main call to action)
about.html        About
contact.html      Contact
assets/css        One stylesheet
assets/js         One script, no libraries
assets/logo       Logo, favicons, social image
assets/video      Hero film and the background loop
vercel.json       Clean URLs and asset caching
robots.txt        Allows indexing
sitemap.xml       Six URLs
README.md         Build notes, and what still needs checking before launch
```

## Two things to change before it goes live

1. **The domain.** `sitemap.xml`, `robots.txt` and the `canonical` /
   `og:image` tags in each page's `<head>` all point at
   `https://www.mastersignsandprint.com`. Find and replace that string
   across the HTML if the final domain differs.
2. **The enquiry form.** `brief.html` posts through `assets/js/site.js`.
   Near the form section there is an `ENDPOINT` constant, currently empty.
   Set it to the CRM or form-handler URL. Until it is set the form still
   works — it validates and hands the completed brief to a pre-filled email
   to `ricky@mastersignsandprint.com` — but nothing is recorded in a system.

`README.md` lists the remaining pre-launch items: the phone number, service
area, in-house versus partner split, client permissions and photography.
