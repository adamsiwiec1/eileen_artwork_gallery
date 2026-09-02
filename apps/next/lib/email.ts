export async function sendStatusEmail(input: {
  to: string;
  orderId: string;
  preset: string;
  note?: string;
}) {
  const bodies: Record<string, { subject: string; text: string }> = {
    accepted: {
      subject: `Your commission ${input.orderId} is on the bench`,
      text: 'Eileen accepted your commission and it has joined the studio queue.',
    },
    in_progress: {
      subject: `Work has started on ${input.orderId}`,
      text: 'The underpainting is underway. We will write again before it ships.',
    },
    ready_to_ship: {
      subject: `${input.orderId} is ready to ship`,
      text: 'The painting is dry and packed. A label will go out shortly.',
    },
    shipped: {
      subject: `${input.orderId} is on its way`,
      text: 'Your painting has left the studio.',
    },
    denied: {
      subject: `Update on commission ${input.orderId}`,
      text: 'We are not able to take this commission right now.',
    },
  };

  const copy = bodies[input.preset] ?? {
    subject: `Update on ${input.orderId}`,
    text: 'A note from the studio.',
  };
  const text = input.note ? `${copy.text}\n\n${input.note}` : copy.text;

  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.log('[email] skipped (no RESEND_API_KEY)', { to: input.to, subject: copy.subject });
    return { id: 'log', skipped: true };
  }

  const { Resend } = await import('resend');
  const resend = new Resend(key);
  const from = process.env.RESEND_FROM ?? 'Eileen Atelier <studio@example.com>';
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: copy.subject,
    text,
  });
  return { id: result.data?.id ?? 'sent', skipped: false };
}
