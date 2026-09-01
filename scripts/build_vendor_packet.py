from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dashboard" / "vendor-packet.pdf"

W, H = letter
green = colors.HexColor("#26C684")
dark = colors.HexColor("#06120F")
ink = colors.HexColor("#17211D")
muted = colors.HexColor("#50645C")
panel = colors.HexColor("#F2F7F4")


def image_reader(path):
    return ImageReader(Image.open(path))


def pill(c, x, y, text):
    c.setFillColor(colors.white)
    c.roundRect(x, y, 142, 22, 10, fill=1, stroke=0)
    c.setFillColor(green)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(x + 71, y + 7, text)


def wrapped(c, text, x, y, width, font="Helvetica", size=9.5, leading=12, color=ink):
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    lines = []
    line = ""
    for word in words:
        test = (line + " " + word).strip()
        if c.stringWidth(test, font, size) <= width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def bullet(c, x, y, title, body):
    c.setFillColor(green)
    c.circle(x + 4, y + 5, 3.2, fill=1, stroke=0)
    c.setFillColor(ink)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(x + 15, y, title)
    return wrapped(c, body, x + 15, y - 13, 230, size=8.5, leading=10.5, color=muted) - 3


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=letter)

    c.setFillColor(colors.white)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    c.setFillColor(dark)
    c.rect(0, H - 2.65 * inch, W, 2.65 * inch, fill=1, stroke=0)
    c.setFillColor(green)
    c.rect(0, H - 2.65 * inch, 0.22 * inch, 2.65 * inch, fill=1, stroke=0)

    logo = image_reader(ROOT / "assets" / "logo" / "logo-white-2.png")
    c.drawImage(logo, 0.62 * inch, H - 0.88 * inch, width=2.15 * inch, height=0.60 * inch, mask="auto")

    pill(c, W - 2.25 * inch, H - 0.82 * inch, "AVAILABLE 24/7")

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(0.62 * inch, H - 1.35 * inch, "Biohazard Cleanup")
    c.drawString(0.62 * inch, H - 1.72 * inch, "Referral Partner Packet")

    c.setFont("Helvetica", 9.4)
    c.setFillColor(colors.HexColor("#C8D7D0"))
    wrapped(c, "Discreet, certified support for trauma, crime scene, death cleanup, and specialty biohazard jobs across Florida.", 0.62 * inch, H - 2.05 * inch, 6.9 * inch, size=9.4, leading=11, color=colors.HexColor("#C8D7D0"))
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(green)
    c.drawString(0.62 * inch, H - 2.36 * inch, "407-758-0682  |  info@peakbioclean.com  |  PeakBioClean.com")

    left = 0.62 * inch
    right = 4.18 * inch
    y = H - 3.05 * inch

    c.setFillColor(panel)
    c.roundRect(left, y - 1.45 * inch, 3.1 * inch, 1.45 * inch, 10, fill=1, stroke=0)
    c.setFillColor(ink)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(left + 0.22 * inch, y - 0.28 * inch, "When to call Peak BioClean")
    c.setFont("Helvetica", 9.3)
    c.setFillColor(muted)
    lines = [
        "Unattended death or decomposition",
        "Crime scene, trauma, and blood cleanup",
        "Hoarding, odor, and hazardous waste removal",
        "Property, hotel, senior living, and estate turns",
    ]
    yy = y - 0.55 * inch
    for line in lines:
        c.setFillColor(green)
        c.circle(left + 0.28 * inch, yy + 3, 2.7, fill=1, stroke=0)
        c.setFillColor(ink)
        c.drawString(left + 0.40 * inch, yy, line)
        yy -= 0.21 * inch

    c.setFillColor(ink)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(right, y - 0.05 * inch, "What referral partners get")
    yy = y - 0.35 * inch
    yy = bullet(c, right, yy, "Fast, discreet response", "A calm field team for sensitive scenes, difficult conversations, and urgent property needs.")
    yy = bullet(c, right, yy, "Insurance-ready documentation", "Photos, scope notes, estimates, and claim support when coverage or reimbursement may apply.")
    yy = bullet(c, right, yy, "Certified handling", "Biohazard protocols, PPE, containment, disposal coordination, and professional cleanup standards.")

    y2 = 3.9 * inch
    c.setStrokeColor(colors.HexColor("#D7E4DE"))
    c.line(0.62 * inch, y2 + 0.15 * inch, W - 0.62 * inch, y2 + 0.15 * inch)

    c.setFillColor(ink)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(left, y2 - 0.08 * inch, "Simple partner handoff")
    yy = y2 - 0.38 * inch
    for n, text in [
        ("1", "Call or text the 24/7 line with the property address and scene type."),
        ("2", "Peak BioClean confirms authorization, access, urgency, and safety conditions."),
        ("3", "The team handles cleanup, documentation, disposal, and follow-up communication."),
    ]:
        c.setFillColor(green)
        c.roundRect(left, yy - 3, 18, 18, 5, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(left + 9, yy + 3, n)
        wrapped(c, text, left + 28, yy + 1, 225, size=8.8, leading=10.2, color=ink)
        yy -= 0.35 * inch

    c.setFillColor(colors.HexColor("#EAF4EF"))
    c.roundRect(right, y2 - 1.45 * inch, 2.75 * inch, 1.42 * inch, 10, fill=1, stroke=0)
    c.setFillColor(dark)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(right + 0.22 * inch, y2 - 0.33 * inch, "Save this contact")
    c.setFillColor(ink)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(right + 0.22 * inch, y2 - 0.68 * inch, "Peak BioClean")
    c.setFont("Helvetica", 10)
    c.drawString(right + 0.22 * inch, y2 - 0.93 * inch, "407-758-0682")
    c.drawString(right + 0.22 * inch, y2 - 1.16 * inch, "info@peakbioclean.com")

    c.setFillColor(dark)
    c.roundRect(0.62 * inch, 0.55 * inch, W - 1.24 * inch, 0.52 * inch, 11, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawString(0.86 * inch, 0.76 * inch, "For immediate help, call 407-758-0682. For partner intros, send details to info@peakbioclean.com.")
    c.setFillColor(colors.HexColor("#9FC9B7"))
    c.setFont("Helvetica", 7.5)
    c.drawRightString(W - 0.62 * inch, 0.28 * inch, "Prepared from PeakBioClean.com service information")
    c.save()
    print(OUT)


if __name__ == "__main__":
    main()
