/**
 * Branded HTML/text builders for MediConnect's transactional emails.
 * Inline styles only — email clients ignore <style>/external CSS.
 */

export type AppointmentEmailKind = 'confirmation' | 'reminder' | 'cancellation'

export interface AppointmentEmailData {
  kind: AppointmentEmailKind
  patientName: string
  doctorName: string
  specialty: string
  dateLabel: string
  timeLabel: string
  /** Absolute URL to the appointment detail page. */
  appointmentUrl: string
}

const BRAND = '#0B6E4F'
const BRAND_DARK = '#064033'
const INK = '#0D1F1A'
const MUTED = '#3D5A52'
const BORDER = '#D6E8E0'
const BG = '#F4F8F6'

interface Copy {
  subject: string
  heading: string
  intro: string
  cta: string
}

function copyFor(d: AppointmentEmailData): Copy {
  switch (d.kind) {
    case 'confirmation':
      return {
        subject: `Appointment confirmed — ${d.doctorName}, ${d.dateLabel}`,
        heading: 'Your appointment is confirmed',
        intro: `Hi ${d.patientName}, your appointment with ${d.doctorName} is booked. The details are below — we'll send a reminder before your visit.`,
        cta: 'View appointment',
      }
    case 'reminder':
      return {
        subject: `Reminder: ${d.doctorName} on ${d.dateLabel} at ${d.timeLabel}`,
        heading: 'A reminder about your upcoming visit',
        intro: `Hi ${d.patientName}, this is a friendly reminder of your appointment with ${d.doctorName}. Please arrive a few minutes early.`,
        cta: 'View appointment',
      }
    case 'cancellation':
      return {
        subject: `Appointment cancelled — ${d.doctorName}, ${d.dateLabel}`,
        heading: 'Your appointment was cancelled',
        intro: `Hi ${d.patientName}, your appointment with ${d.doctorName} on ${d.dateLabel} has been cancelled. You can book a new time whenever you're ready.`,
        cta: 'Book again',
      }
  }
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 0;color:${MUTED};font-size:13px;width:110px;">${label}</td>
      <td style="padding:6px 0;color:${INK};font-size:14px;font-weight:500;">${value}</td>
    </tr>`
}

export function buildAppointmentEmail(d: AppointmentEmailData): {
  subject: string
  html: string
  text: string
} {
  const c = copyFor(d)
  const accent = d.kind === 'cancellation' ? '#C53030' : BRAND

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BG};font-family:'Inter',Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
                <span style="font-size:18px;font-weight:600;color:${BRAND_DARK};letter-spacing:-0.01em;">MediConnect</span>
                <span style="display:block;font-size:11px;color:${MUTED};margin-top:2px;">Your trusted path to care</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 8px;font-size:19px;font-weight:600;color:${INK};">${c.heading}</h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">${c.intro}</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border:1px solid ${BORDER};border-radius:10px;padding:14px 16px;">
                  ${row('Doctor', d.doctorName)}
                  ${row('Specialty', d.specialty)}
                  ${row('Date', d.dateLabel)}
                  ${row('Time', d.timeLabel)}
                </table>

                <div style="text-align:center;margin:24px 0 4px;">
                  <a href="${d.appointmentUrl}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 22px;border-radius:8px;">${c.cta}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid ${BORDER};">
                <p style="margin:0;font-size:11px;color:#7A9A90;">© 2026 MediConnect. This is an automated message — please don't reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    c.heading,
    '',
    c.intro,
    '',
    `Doctor:    ${d.doctorName}`,
    `Specialty: ${d.specialty}`,
    `Date:      ${d.dateLabel}`,
    `Time:      ${d.timeLabel}`,
    '',
    `${c.cta}: ${d.appointmentUrl}`,
    '',
    '© 2026 MediConnect — automated message, please do not reply.',
  ].join('\n')

  return { subject: c.subject, html, text }
}
