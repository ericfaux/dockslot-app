import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { format, parseISO } from 'date-fns';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/waivers/[id]/pdf
 * Generate a printable HTML page for the signed waiver that can be saved as PDF
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: signatureId } = await params;

    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the signature with related data
    const { data: signature, error: signatureError } = await supabase
      .from('waiver_signatures')
      .select(`
        *,
        waiver_template:waiver_templates(
          id,
          title,
          content,
          owner_id,
          version
        ),
        booking:bookings(
          id,
          guest_name,
          scheduled_start,
          captain_id,
          vessel:vessels(name),
          trip_type:trip_types(title)
        ),
        passenger:passengers(
          id,
          full_name,
          email
        )
      `)
      .eq('id', signatureId)
      .single();

    if (signatureError || !signature) {
      return NextResponse.json({ error: 'Waiver signature not found' }, { status: 404 });
    }

    // Verify the captain owns this waiver's booking
    const booking = signature.booking as any;
    if (booking?.captain_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const template = signature.waiver_template as any;
    const passenger = signature.passenger as any;

    // Generate printable HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signed Waiver - ${signature.signer_name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-item {
      padding: 12px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .info-item .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }
    .info-item .value {
      font-weight: 500;
    }
    .waiver-content {
      padding: 24px;
      background: #f9f9f9;
      border-radius: 8px;
      font-size: 14px;
      white-space: pre-wrap;
    }
    .signature-section {
      margin-top: 40px;
      padding: 24px;
      border: 2px solid #e5e5e5;
      border-radius: 8px;
    }
    .signature-image {
      background: white;
      padding: 20px;
      border: 1px solid #e5e5e5;
      border-radius: 4px;
      margin-top: 16px;
      text-align: center;
    }
    .signature-image img {
      max-width: 300px;
      max-height: 100px;
    }
    .signature-details {
      margin-top: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 13px;
    }
    .signature-details .item {
      padding: 8px 12px;
      background: #f0f0f0;
      border-radius: 4px;
    }
    .signature-details .item .label {
      color: #666;
      font-size: 11px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e5e5;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .audit-section {
      margin-top: 30px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 12px;
    }
    .audit-section h3 {
      font-size: 13px;
      margin-bottom: 12px;
    }
    .audit-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .audit-item:last-child {
      border-bottom: none;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${template?.title || 'Signed Waiver'}</h1>
    <div class="subtitle">Version ${signature.template_version} • Document ID: ${signatureId.substring(0, 8).toUpperCase()}</div>
  </div>

  <div class="section">
    <div class="section-title">Trip Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Guest Name</div>
        <div class="value">${booking?.guest_name || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="label">Trip Type</div>
        <div class="value">${booking?.trip_type?.title || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="label">Vessel</div>
        <div class="value">${booking?.vessel?.name || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="label">Scheduled Date</div>
        <div class="value">${booking?.scheduled_start ? format(parseISO(booking.scheduled_start), 'MMMM d, yyyy \'at\' h:mm a') : 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Waiver Content</div>
    <div class="waiver-content">${template?.content || 'Content not available'}</div>
  </div>

  <div class="signature-section">
    <div class="section-title">Electronic Signature</div>
    <p style="font-size: 13px; color: #666; margin-bottom: 16px;">
      By signing below, the signer acknowledges that they have read, understood, and agreed to the terms of this waiver.
      This electronic signature is legally binding and has the same effect as a handwritten signature.
    </p>

    ${signature.signature_data ? `
    <div class="signature-image">
      <img src="${signature.signature_data}" alt="Signature" />
    </div>
    ` : '<p style="text-align: center; color: #999;">Signature image not available</p>'}

    <div class="signature-details">
      <div class="item">
        <div class="label">Signed By</div>
        <div>${signature.signer_name}</div>
      </div>
      <div class="item">
        <div class="label">Email</div>
        <div>${signature.signer_email || 'N/A'}</div>
      </div>
      <div class="item">
        <div class="label">Date & Time</div>
        <div>${format(parseISO(signature.signed_at), 'MMMM d, yyyy \'at\' h:mm:ss a')}</div>
      </div>
      <div class="item">
        <div class="label">Timezone</div>
        <div>${signature.device_info?.timezone || 'N/A'}</div>
      </div>
    </div>
  </div>

  <div class="audit-section">
    <h3>Audit Trail</h3>
    <div class="audit-item">
      <span>Document Signed</span>
      <span>${format(parseISO(signature.signed_at), 'MMM d, yyyy h:mm:ss a')}</span>
    </div>
    <div class="audit-item">
      <span>IP Address</span>
      <span>${signature.ip_address || 'Not recorded'}</span>
    </div>
    <div class="audit-item">
      <span>Device Platform</span>
      <span>${signature.device_info?.platform || 'Not recorded'}</span>
    </div>
    <div class="audit-item">
      <span>Screen Resolution</span>
      <span>${signature.device_info ? `${signature.device_info.screen_width}x${signature.device_info.screen_height}` : 'Not recorded'}</span>
    </div>
    <div class="audit-item">
      <span>Template Version</span>
      <span>v${signature.template_version}</span>
    </div>
  </div>

  <div class="footer">
    <p>This document was electronically signed using DockSlot.</p>
    <p>Generated on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}</p>
  </div>

  <script>
    // Auto-trigger print dialog for easy PDF saving
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="waiver-${signature.signer_name.replace(/\s+/g, '-')}-${signatureId.substring(0, 8)}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating waiver PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
