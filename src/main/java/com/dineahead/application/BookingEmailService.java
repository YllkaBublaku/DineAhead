package com.dineahead.application;

import com.dineahead.domain.Payment;
import com.dineahead.domain.Reservation;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class BookingEmailService {

    private static final String GUEST_DASHBOARD_URL =
            "http://localhost:4200/dashboard?tab=bookings";
    private static final String OWNER_DASHBOARD_URL =
            "http://localhost:4200/restaurant-dashboard";
    private static final String ADMIN_DASHBOARD_URL =
            "http://localhost:4200/platform-admin";

    private final EmailService emailService;

    @Value("${app.booking.owner-notification-email:yllkabublaku@gmail.com}")
    private String ownerNotificationEmail;

    public BookingEmailService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void sendBookingConfirmation(Reservation reservation, Payment payment) {
        if (reservation == null) return;

        User guest = reservation.getUser();
        Restaurant restaurant = reservation.getRestaurant();

        if (guest != null && guest.getEmail() != null) {
            String subject = "Your reservation at " + safeName(restaurant) + " is confirmed";
            emailService.sendHtml(guest.getEmail(), subject, buildGuestEmail(reservation, payment));
        }

        String ownerEmail = resolveOwnerEmail(restaurant);
        if (ownerEmail != null && !ownerEmail.isBlank()
                && (guest == null || !ownerEmail.equalsIgnoreCase(guest.getEmail()))) {
            String subject = "New booking at " + safeName(restaurant);
            emailService.sendHtml(ownerEmail, subject, buildOwnerEmail(reservation, payment));
        }

        if (ownerNotificationEmail != null && !ownerNotificationEmail.isBlank()
                && (guest == null || !ownerNotificationEmail.equalsIgnoreCase(guest.getEmail()))) {
            String subject = "New booking at " + safeName(restaurant);
            emailService.sendHtml(ownerNotificationEmail, subject, buildAdminEmail(reservation, payment));
        }
    }

    private String resolveOwnerEmail(Restaurant restaurant) {
        if (restaurant == null) return null;
        return null;
    }

    private String buildGuestEmail(Reservation reservation, Payment payment) {
        Restaurant restaurant = reservation.getRestaurant();
        User guest = reservation.getUser();

        String firstName = (guest != null && guest.getFirstName() != null)
                ? guest.getFirstName()
                : "there";

        String date = formatDate(reservation.getReservationDate());
        String time = formatTime(reservation.getReservationTime());
        int partySize = reservation.getPartySize() != null ? reservation.getPartySize() : 0;

        String depositBlock = buildDepositBlock(reservation, payment, true);
        String requestsBlock = buildRequestsBlock(reservation, true);
        String addressBlock = buildAddressBlock(restaurant);

        return commonEmailShell(
                "Your reservation is confirmed",
                "Hi " + escape(firstName) + " — here are the details for your upcoming visit.",
                safeName(restaurant),
                addressBlock,
                date, time, partySize,
                depositBlock,
                requestsBlock,
                GUEST_DASHBOARD_URL,
                "VIEW RESERVATION",
                "Need to cancel or change? You can do that from your dashboard up to a few hours before your reservation."
        );
    }

    private String buildOwnerEmail(Reservation reservation, Payment payment) {
        Restaurant restaurant = reservation.getRestaurant();
        User guest = reservation.getUser();

        String guestName = safeGuestName(guest);
        String guestEmail = (guest != null && guest.getEmail() != null) ? guest.getEmail() : "";
        String guestPhone = (guest != null && guest.getPhone() != null) ? guest.getPhone() : "";

        String date = formatDate(reservation.getReservationDate());
        String time = formatTime(reservation.getReservationTime());
        int partySize = reservation.getPartySize() != null ? reservation.getPartySize() : 0;

        String depositBlock = buildDepositBlock(reservation, payment, false);
        String requestsBlock = buildRequestsBlock(reservation, false);
        String guestBlock = buildGuestBlock(guestName, guestEmail, guestPhone);

        return commonEmailShell(
                "New booking at " + escape(safeName(restaurant)),
                "A guest has just made a reservation.",
                null,
                null,
                date, time, partySize,
                depositBlock,
                requestsBlock,
                OWNER_DASHBOARD_URL,
                "OPEN DASHBOARD",
                null
        ).replace("<!--EXTRA_TOP-->", guestBlock);
    }

    private String buildAdminEmail(Reservation reservation, Payment payment) {
        Restaurant restaurant = reservation.getRestaurant();
        User guest = reservation.getUser();

        String guestName = safeGuestName(guest);
        String guestEmail = (guest != null && guest.getEmail() != null) ? guest.getEmail() : "";
        String guestPhone = (guest != null && guest.getPhone() != null) ? guest.getPhone() : "";

        String date = formatDate(reservation.getReservationDate());
        String time = formatTime(reservation.getReservationTime());
        int partySize = reservation.getPartySize() != null ? reservation.getPartySize() : 0;

        String depositBlock = buildDepositBlock(reservation, payment, false);
        String requestsBlock = buildRequestsBlock(reservation, false);
        String guestBlock = buildGuestBlock(guestName, guestEmail, guestPhone);

        return commonEmailShell(
                "New booking at " + escape(safeName(restaurant)),
                "A new reservation has been created on the platform.",
                null,
                null,
                date, time, partySize,
                depositBlock,
                requestsBlock,
                ADMIN_DASHBOARD_URL,
                "OPEN ADMIN DASHBOARD",
                null
        ).replace("<!--EXTRA_TOP-->", guestBlock);
    }

    private String commonEmailShell(
            String headline,
            String subheadline,
            String restaurantName,
            String addressBlock,
            String date,
            String time,
            int partySize,
            String depositBlock,
            String requestsBlock,
            String dashboardUrl,
            String buttonLabel,
            String footerNote
    ) {
        String restaurantSection = "";
        if (restaurantName != null) {
            restaurantSection =
                    "<div style=\"padding:24px 40px 0;\">" +
                            "<div style=\"color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">RESTAURANT</div>" +
                            "<div style=\"color:#111827;font-size:20px;font-weight:800;margin-top:6px;letter-spacing:-0.3px;\">" +
                            escape(restaurantName) + "</div>" +
                            (addressBlock != null ? addressBlock : "") +
                            "</div>";
        }

        String footerNoteHtml = footerNote != null
                ? "<p style=\"margin:20px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;\">" +
                escape(footerNote) + "</p>"
                : "";

        return "<!DOCTYPE html><html><body style=\"margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;\">" +
                "<div style=\"max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);\">" +

                "<div style=\"padding:40px 40px 0;\">" +
                "<div style=\"color:#111827;font-size:20px;font-weight:800;letter-spacing:-0.3px;\">DineAhead</div>" +
                "</div>" +

                "<div style=\"padding:32px 40px 8px;\">" +
                "<h1 style=\"margin:0;color:#111827;font-size:26px;font-weight:800;line-height:1.25;letter-spacing:-0.5px;\">" +
                headline + "</h1>" +
                "<p style=\"margin:12px 0 0;color:#6b7280;font-size:14px;line-height:1.6;\">" +
                subheadline + "</p>" +
                "</div>" +

                "<!--EXTRA_TOP-->" +

                restaurantSection +

                "<div style=\"padding:24px 40px 0;\"><div style=\"height:1px;background:#e5e7eb;\"></div></div>" +

                "<div style=\"padding:0 40px;\">" +
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">" +
                "<tr>" +
                "<td style=\"padding:20px 0 6px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">DATE</td>" +
                "<td style=\"padding:20px 0 6px;text-align:right;color:#111827;font-size:15px;font-weight:700;\">" + date + "</td>" +
                "</tr>" +
                "<tr>" +
                "<td style=\"padding:14px 0 6px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">TIME</td>" +
                "<td style=\"padding:14px 0 6px;text-align:right;color:#111827;font-size:15px;font-weight:700;\">" + time + "</td>" +
                "</tr>" +
                "<tr>" +
                "<td style=\"padding:14px 0 6px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">PARTY SIZE</td>" +
                "<td style=\"padding:14px 0 6px;text-align:right;color:#111827;font-size:15px;font-weight:700;\">" + partySize + " " + (partySize == 1 ? "guest" : "guests") + "</td>" +
                "</tr>" +
                depositBlock +
                "</table>" +
                "</div>" +

                requestsBlock +

                "<div style=\"padding:32px 40px 40px;\">" +
                "<a href=\"" + dashboardUrl + "\" " +
                "style=\"display:inline-block;background:#111827;color:#ffffff;text-decoration:none;" +
                "padding:14px 28px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.5px;\">" +
                buttonLabel + "</a>" +
                footerNoteHtml +
                "</div>" +

                "<div style=\"background:#f9fafb;padding:24px 40px;text-align:center;color:#9ca3af;font-size:11px;line-height:1.6;border-top:1px solid #e5e7eb;\">" +
                "<div style=\"font-weight:700;color:#6b7280;margin-bottom:4px;\">DineAhead</div>" +
                "<div>This is an automated notification. Please do not reply to this email.</div>" +
                "</div>" +

                "</div></body></html>";
    }

    private String buildGuestBlock(String guestName, String guestEmail, String guestPhone) {
        return "<div style=\"padding:24px 40px 0;\">" +
                "<div style=\"color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">GUEST</div>" +
                "<div style=\"color:#111827;font-size:17px;font-weight:700;margin-top:6px;\">" + escape(guestName) + "</div>" +
                (!guestEmail.isBlank() ? "<div style=\"color:#6b7280;font-size:13px;margin-top:4px;\">" + escape(guestEmail) + "</div>" : "") +
                (!guestPhone.isBlank() ? "<div style=\"color:#6b7280;font-size:13px;margin-top:2px;\">" + escape(guestPhone) + "</div>" : "") +
                "</div>";
    }

    private String buildAddressBlock(Restaurant restaurant) {
        if (restaurant != null && restaurant.getAddress() != null && !restaurant.getAddress().isBlank()) {
            return "<div style=\"color:#6b7280;font-size:13px;margin-top:6px;line-height:1.5;\">" +
                    escape(restaurant.getAddress()) + "</div>";
        }
        return null;
    }

    private String buildDepositBlock(Reservation reservation, Payment payment, boolean guestStyle) {
        BigDecimal depositAmount = resolveDepositAmount(reservation, payment);
        if (depositAmount == null) return "";

        boolean paid = isDepositPaid(reservation, payment);
        String statusText = guestStyle
                ? (paid ? "Paid" : "To be paid at the restaurant")
                : (paid ? "Paid" : "To be paid at restaurant");
        String statusColor = paid ? "#065f46" : "#92400e";

        return "<tr>" +
                "<td style=\"padding:14px 0 6px;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;\">DEPOSIT</td>" +
                "<td style=\"padding:14px 0 6px;text-align:right;color:#111827;font-size:15px;font-weight:700;\">€" +
                depositAmount.stripTrailingZeros().toPlainString() +
                "</td>" +
                "</tr>" +
                "<tr><td colspan=\"2\" style=\"padding:0 0 8px;color:" + statusColor + ";font-size:12px;text-align:right;\">" +
                statusText + "</td></tr>";
    }

    private String buildRequestsBlock(Reservation reservation, boolean guestStyle) {
        String specialRequests = reservation.getSpecialRequests();
        if (specialRequests == null || specialRequests.isBlank()) return "";

        String bg = guestStyle ? "#f9fafb" : "#fffbeb";
        String border = guestStyle ? "#005943" : "#f59e0b";
        String labelColor = guestStyle ? "#6b7280" : "#92400e";
        String textColor = guestStyle ? "#374151" : "#78350f";

        return "<div style=\"margin-top:24px;padding:16px 18px;background:" + bg + ";border-left:3px solid " + border + ";\">" +
                "<div style=\"color:" + labelColor + ";font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;\">SPECIAL REQUESTS</div>" +
                "<div style=\"color:" + textColor + ";font-size:14px;line-height:1.6;\">" + escape(specialRequests) + "</div>" +
                "</div>";
    }

    private BigDecimal resolveDepositAmount(Reservation reservation, Payment payment) {
        if (payment != null && payment.getDepositAmount() != null
                && payment.getDepositAmount().compareTo(BigDecimal.ZERO) > 0) {
            return payment.getDepositAmount();
        }
        if (reservation.getDepositAmount() != null
                && reservation.getDepositAmount().compareTo(BigDecimal.ZERO) > 0) {
            return reservation.getDepositAmount();
        }
        return null;
    }

    private boolean isDepositPaid(Reservation reservation, Payment payment) {
        return Boolean.TRUE.equals(reservation.getDepositPaid())
                || (payment != null && payment.getStatus() != null
                && payment.getStatus().name().equals("SUCCEEDED"));
    }

    private String safeGuestName(User guest) {
        if (guest == null) return "Guest";
        String fn = guest.getFirstName() != null ? guest.getFirstName() : "";
        String ln = guest.getLastName() != null ? guest.getLastName() : "";
        String name = (fn + " " + ln).trim();
        return name.isEmpty() ? "Guest" : name;
    }

    private String safeName(Restaurant r) {
        return (r != null && r.getName() != null) ? r.getName() : "the restaurant";
    }

    private String formatDate(LocalDate date) {
        if (date == null) return "—";
        return date.format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy"));
    }

    private String formatTime(LocalTime time) {
        if (time == null) return "—";
        return time.format(DateTimeFormatter.ofPattern("h:mm a"));
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}