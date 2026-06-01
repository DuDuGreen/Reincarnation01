<?php
header('Content-Type: application/json; charset=utf-8');

// Configuration
$to_email = 'bookings@reincarnation.in'; // Target workshop mailbox
$subject = 'New Car Workshop Appointment - Reincarnation';

// Validate request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method Not Allowed'
    ]);
    exit;
}

// Extract and sanitize input data
$full_name = filter_input(INPUT_POST, 'full_name', FILTER_SANITIZE_SPECIAL_CHARS);
$phone = filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_SPECIAL_CHARS);
$car_model = filter_input(INPUT_POST, 'car_model', FILTER_SANITIZE_SPECIAL_CHARS);
$service_type = filter_input(INPUT_POST, 'service_type', FILTER_SANITIZE_SPECIAL_CHARS);
$booking_date = filter_input(INPUT_POST, 'booking_date', FILTER_SANITIZE_SPECIAL_CHARS);
$time_slot = filter_input(INPUT_POST, 'time_slot', FILTER_SANITIZE_SPECIAL_CHARS);
$notes = filter_input(INPUT_POST, 'notes', FILTER_SANITIZE_SPECIAL_CHARS);

// Validation
if (empty($full_name) || empty($phone) || empty($car_model) || empty($service_type) || empty($booking_date) || empty($time_slot)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Please fill in all required fields.'
    ]);
    exit;
}

// Clean phone format
$phone = preg_replace('/\s+/', '', $phone);
if (!preg_match('/^[6-9]\d{9}$/', $phone)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Please enter a valid 10-digit Indian phone number.'
    ]);
    exit;
}

$full_phone = '+91 ' . $phone;

// Prepare Email Body (HTML formatted)
$email_content = "
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #dddddd; border-radius: 8px; background-color: #fcfcfc; }
        .header { background-color: #0c0c0f; color: #ffcc00; padding: 20px; border-radius: 6px 6px 0 0; text-align: center; }
        .header h2 { margin: 0; text-transform: uppercase; font-weight: bold; }
        .content { padding: 20px; }
        .field { margin-bottom: 15px; border-bottom: 1px solid #f1f1f1; padding-bottom: 10px; }
        .field-label { font-weight: bold; color: #666666; font-size: 13px; text-transform: uppercase; }
        .field-value { font-size: 16px; margin-top: 4px; color: #111111; }
        .notes-box { background-color: #f3f4f6; border-left: 4px solid #ffcc00; padding: 12px; margin-top: 15px; border-radius: 4px; font-style: italic; }
        .footer { margin-top: 25px; text-align: center; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; padding-top: 15px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>Reincarnation Booking Request</h2>
        </div>
        <div class='content'>
            <div class='field'>
                <div class='field-label'>Customer Name</div>
                <div class='field-value'>{$full_name}</div>
            </div>
            <div class='field'>
                <div class='field-label'>Contact Number</div>
                <div class='field-value'><a href='tel:{$full_phone}'>{$full_phone}</a> | <a href='https://wa.me/91{$phone}'>Open in WhatsApp</a></div>
            </div>
            <div class='field'>
                <div class='field-label'>Vehicle Make & Model</div>
                <div class='field-value'>{$car_model}</div>
            </div>
            <div class='field'>
                <div class='field-label'>Requested Service</div>
                <div class='field-value' style='color:#e6b800; font-weight:bold;'>{$service_type}</div>
            </div>
            <div class='field'>
                <div class='field-label'>Date & Preferred Slot</div>
                <div class='field-value'>{$booking_date} | {$time_slot}</div>
            </div>
            " . (!empty($notes) ? "
            <div class='field'>
                <div class='field-label'>Special Requirements</div>
                <div class='notes-box'>\"{$notes}\"</div>
            </div>
            " : "") . "
        </div>
        <div class='footer'>
            <p>This message was sent from the booking portal of Reincarnation Car Workshop.</p>
            <p>Optimized for Hostinger Web Hosting.</p>
        </div>
    </div>
</body>
</html>
";

// Prepare Email Headers
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=utf-8';
$headers[] = 'From: Reincarnation Bookings Portal <no-reply@reincarnation.in>';
$headers[] = 'Reply-To: no-reply@reincarnation.in';
$headers[] = 'X-Mailer: PHP/' . phpversion();

// Send Mail
$mail_success = mail($to_email, $subject, $email_content, implode("\r\n", $headers));

if ($mail_success) {
    echo json_encode([
        'success' => true,
        'message' => 'Your appointment request has been sent successfully!'
    ]);
} else {
    // If the server mail configuration fails, we still return code 500 but log details.
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server failed to send email. Please try contacting via WhatsApp.'
    ]);
}
?>
