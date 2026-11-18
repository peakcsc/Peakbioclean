# Peak Bio-Clean — Lead Outreach Message Templates
Owner: Parker Peak · Phone: (407) 758-0682 · info@peakbioclean.com

These are written to be dropped into whatever sends your automated texts/emails
— your dashboard already sends outreach email via Gmail (info@peakbioclean.com)
and has a Twilio SMS action wired up; this is the content to put behind missed-
call text-back, a website form auto-reply, and a review request, whenever you
wire those triggers up. Swap `[Name]` for a real name where your system supports
merge fields.

====================================================================
1) MISSED-CALL TEXT-BACK  (fires when a call is missed)
====================================================================
A caller to a biohazard/crime-scene line is very often in crisis — faster,
warmer follow-up matters more here than almost any other industry.

MESSAGE:
Hi, this is Peak Bio-Clean — sorry we missed your call. We're available 24/7.
Reply here with what's going on and we'll call you right back, or call us
again at (407) 758-0682 any time. — Parker

====================================================================
2) WEBSITE FORM AUTO-REPLY  (fires when the contact form is submitted)
====================================================================
SMS:
Hi [Name], thanks for reaching out to Peak Bio-Clean. We got your message and
will call you shortly. Need us sooner? Call (407) 758-0682 any time, day or
night. — Parker

EMAIL SUBJECT:
We received your message — Peak Bio-Clean

EMAIL BODY:
Hi [Name],

Thank you for reaching out to Peak Bio-Clean. We've received your message and
will call you shortly to talk through what's going on and how we can help.

We're available 24/7, including holidays — a real person always answers. If
you'd rather talk now, call (407) 758-0682.

We're here for you,
Parker Peak
Peak Bio-Clean
(407) 758-0682
peakbioclean.com

====================================================================
3) VENDOR / REFERRAL PARTNER FOLLOW-UP
====================================================================
(For property managers, funeral homes, law enforcement/victim advocates,
insurance professionals, and other referral contacts — see /vendor-partners/
and the 7 /for/ pages already live on the site.)

--- Initial outreach (already built as VENDOR_EMAIL in the dashboard) ---
Already live in your dashboard's compose tool as the default vendor-packet
email template — no change needed.

--- Follow-up (if no response after ~1 week) ---
Hi [Name], following up in case my last note got buried — I'd like to get Peak
Bio-Clean's insurance certificate, W-9, and direct line into your vendor file
so it's ready before the next incident. Happy to send it over or hop on a quick
call. (407) 758-0682 — Parker

====================================================================
4) REVIEW REQUEST  (residential/family — send a few days after the job, see
   review-kit.md for the full tone guidance on this)
====================================================================
MESSAGE (swap in your direct Google review link once GBP is verified):
Hi [Name], this is Parker from Peak Bio-Clean. Just checking in to make sure
everything's okay with the property. If you're ever comfortable sharing a
quick review, it helps other families find us — totally optional, only if it
feels right. [REVIEW LINK]

====================================================================
5) REVIEW REQUEST  (commercial / referral partner — normal B2B timing is fine)
====================================================================
MESSAGE:
Hi [Name], thanks for trusting Peak Bio-Clean with that job. If you have a
minute, a quick Google review helps us a lot — and we're always here for the
next one. [REVIEW LINK]

====================================================================
SETUP NOTES
====================================================================
- Email sending is already live (dashboard → Gmail, info@peakbioclean.com).
- SMS sending exists via the dashboard's Twilio action — confirm it's wired to
  fire automatically on missed calls and form submissions, or keep sending
  these manually from the dashboard's compose tool until that automation is
  built.
- Test every automated message to your own phone/email before relying on it.
