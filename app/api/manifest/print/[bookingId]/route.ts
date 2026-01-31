import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { format, parseISO } from 'date-fns';

/**
 * Generate print-friendly passenger manifest for Coast Guard compliance
 * Returns HTML page optimized for printing
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await context.params;
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Not authenticated', { status: 401 });
    }

    // Fetch booking with all details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        trip_type:trip_types(title, description, duration_hours),
        vessel:vessels(name, capacity),
        passengers:booking_passengers(*)
      `)
      .eq('id', bookingId)
      .eq('captain_id', user.id)
      .single();

    if (error || !booking) {
      return new NextResponse('Booking not found', { status: 404 });
    }

    // Fetch captain profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, full_name, phone')
      .eq('id', user.id)
      .single();

    const captainName = profile?.business_name || profile?.full_name || 'Captain';
    const html = generateManifestHTML(booking, captainName);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Manifest print error:', error);
    return new NextResponse('Failed to generate manifest', { status: 500 });
  }
}

function generateManifestHTML(booking: any, captainName: string): string {
  const tripType = Array.isArray(booking.trip_type)
    ? booking.trip_type[0]
    : booking.trip_type;
  const vessel = Array.isArray(booking.vessel) ? booking.vessel[0] : booking.vessel;
  const passengers = Array.isArray(booking.passengers) ? booking.passengers : [];

  const scheduledStart = parseISO(booking.scheduled_start);
  const tripDate = format(scheduledStart, 'EEEE, MMMM d, yyyy');
  const tripTime = format(scheduledStart, 'h:mm a');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passenger Manifest - ${booking.guest_name} - ${tripDate}</title>
  <style>
    @media print {
      @page {
        size: letter;
        margin: 0.5in;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      border-bottom: 3px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .header p {
      font-size: 12px;
      color: #666;
    }

    .manifest-number {
      text-align: right;
      font-size: 12px;
      color: #666;
      margin-top: -20px;
      margin-bottom: 20px;
    }

    .section {
      margin-bottom: 25px;
    }

    .section-title {
      background: #f0f0f0;
      padding: 8px 12px;
      font-weight: bold;
      font-size: 14px;
      border-left: 4px solid #000;
      margin-bottom: 10px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 8px 15px;
      font-size: 13px;
    }

    .info-label {
      font-weight: bold;
    }

    .passenger-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 12px;
    }

    .passenger-table th {
      background: #000;
      color: #fff;
      padding: 10px 8px;
      text-align: left;
      font-weight: bold;
    }

    .passenger-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #ddd;
    }

    .passenger-table tr:nth-child(even) {
      background: #f9f9f9;
    }

    .signature-section {
      margin-top: 40px;
      page-break-inside: avoid;
    }

    .signature-line {
      border-top: 1px solid #000;
      margin-top: 30px;
      padding-top: 5px;
      font-size: 11px;
    }

    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0066cc;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .print-button:hover {
      background: #0052a3;
    }

    .emergency-section {
      background: #fff9e6;
      border: 2px solid #ffcc00;
      padding: 15px;
      margin-top: 20px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print Manifest</button>

  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>⚓ PASSENGER MANIFEST</h1>
      <p>For Coast Guard and Safety Compliance</p>
    </div>

    <div class="manifest-number">
      <strong>Manifest ID:</strong> ${booking.id.substring(0, 8).toUpperCase()}
    </div>

    <!-- Vessel & Trip Information -->
    <div class="section">
      <div class="section-title">VESSEL & TRIP INFORMATION</div>
      <div class="info-grid">
        <div class="info-label">Vessel Name:</div>
        <div>${vessel?.name || 'N/A'}</div>

        <div class="info-label">Vessel Capacity:</div>
        <div>${vessel?.capacity || 'N/A'} passengers</div>

        <div class="info-label">Captain/Operator:</div>
        <div>${captainName}</div>

        <div class="info-label">Trip Type:</div>
        <div>${tripType?.title || 'Charter Trip'}</div>

        <div class="info-label">Trip Date:</div>
        <div>${tripDate}</div>

        <div class="info-label">Departure Time:</div>
        <div>${tripTime}</div>

        <div class="info-label">Duration:</div>
        <div>${tripType?.duration_hours || 'N/A'} hour${tripType?.duration_hours === 1 ? '' : 's'}</div>

        <div class="info-label">Departure Point:</div>
        <div>${booking.meeting_spot || 'See booking details'}</div>
      </div>
    </div>

    <!-- Primary Contact -->
    <div class="section">
      <div class="section-title">PRIMARY CONTACT</div>
      <div class="info-grid">
        <div class="info-label">Name:</div>
        <div>${booking.guest_name}</div>

        <div class="info-label">Email:</div>
        <div>${booking.guest_email}</div>

        <div class="info-label">Phone:</div>
        <div>${booking.guest_phone || 'Not provided'}</div>

        <div class="info-label">Total Passengers:</div>
        <div>${booking.party_size}</div>
      </div>
    </div>

    <!-- Passenger List -->
    <div class="section">
      <div class="section-title">PASSENGER LIST</div>
      ${
        passengers.length > 0
          ? `
      <table class="passenger-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 25%;">Full Name</th>
            <th style="width: 10%;">Age</th>
            <th style="width: 20%;">Emergency Contact</th>
            <th style="width: 20%;">Contact Phone</th>
            <th style="width: 20%;">Medical Conditions</th>
          </tr>
        </thead>
        <tbody>
          ${passengers
            .map(
              (p: any, idx: number) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${p.full_name || 'Name pending'}</strong></td>
            <td>${p.age || 'N/A'}</td>
            <td>${p.emergency_contact_name || 'Not provided'}</td>
            <td>${p.emergency_contact_phone || 'Not provided'}</td>
            <td>${p.medical_conditions || 'None'}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      `
          : `
      <p style="padding: 20px; text-align: center; color: #666;">
        <em>Passenger details pending. Primary contact: ${booking.guest_name} (${booking.party_size} passenger${booking.party_size === 1 ? '' : 's'})</em>
      </p>
      `
      }
    </div>

    <!-- Safety Equipment -->
    <div class="section">
      <div class="section-title">SAFETY EQUIPMENT CHECK</div>
      <div style="font-size: 12px; line-height: 2;">
        <label><input type="checkbox"> Life jackets (${vessel?.capacity || booking.party_size} required)</label><br>
        <label><input type="checkbox"> Fire extinguisher</label><br>
        <label><input type="checkbox"> First aid kit</label><br>
        <label><input type="checkbox"> Flares/visual distress signals</label><br>
        <label><input type="checkbox"> Sound-producing device (horn/whistle)</label><br>
        <label><input type="checkbox"> VHF radio operational</label><br>
        <label><input type="checkbox"> Navigation lights operational</label><br>
      </div>
    </div>

    <!-- Emergency Procedures -->
    <div class="emergency-section">
      <strong>⚠️ EMERGENCY PROCEDURES:</strong>
      <ul style="margin: 10px 0 0 20px; font-size: 12px;">
        <li>VHF Channel 16 for distress calls</li>
        <li>Coast Guard: 911 or VHF Channel 16</li>
        <li>All passengers briefed on life jacket location and use</li>
        <li>Man overboard procedures reviewed</li>
      </ul>
    </div>

    <!-- Captain Signature -->
    <div class="signature-section">
      <div class="section-title">CERTIFICATION</div>
      <p style="font-size: 12px; margin-bottom: 40px;">
        I certify that this vessel is seaworthy, all required safety equipment is aboard and operational, 
        and all passengers have been briefed on safety procedures.
      </p>
      <div class="signature-line">
        Captain Signature: ___________________________________ Date: _________________
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>This manifest generated by DockSlot on ${format(new Date(), 'MMMM d, yyyy \'at\' h:mm a')}</p>
      <p>Retain this document for a minimum of 6 months for Coast Guard compliance</p>
    </div>
  </div>
</body>
</html>`;
}
