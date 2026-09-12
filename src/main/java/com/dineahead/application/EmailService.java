package com.dineahead.application;

import com.dineahead.domain.Contact;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.contact.notification-email:yllkabublaku@gmail.com}")
    private String notificationEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendContactEmails(Contact contact) {
        sendNotificationToSupport(contact);
        sendAutoReplyToUser(contact);
    }

    private void sendNotificationToSupport(Contact contact) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(notificationEmail);
            message.setSubject("New Contact Form Submission: " + contact.getSubject());
            message.setText(
                    "New message received from your website!\n\n" +
                            "Name: " + contact.getName() + "\n" +
                            "Email: " + contact.getEmail() + "\n" +
                            "Subject: " + contact.getSubject() + "\n\n" +
                            "Message:\n" + contact.getMessage() + "\n\n" +
                            "Received: " + contact.getCreatedAt()
            );
            mailSender.send(message);
            System.out.println(" Notification sent to support: " + notificationEmail);
        } catch (Exception e) {
            System.err.println(" Failed to send support notification: " + e.getMessage());
        }
    }

    private void sendAutoReplyToUser(Contact contact) {
        try {
            SimpleMailMessage reply = new SimpleMailMessage();
            reply.setTo(contact.getEmail());
            reply.setSubject("Thank you for contacting DineAhead");
            reply.setText(
                    "Dear " + contact.getName() + ",\n\n" +
                            "Thank you for reaching out to DineAhead! We have received your message " +
                            "and will get back to you within 24 hours.\n\n" +
                            "Your message:\n" + contact.getMessage() + "\n\n" +
                            "Best regards,\n" +
                            "The DineAhead Team\n" +
                            "support@dineahead.com"
            );
            mailSender.send(reply);
            System.out.println(" Auto-reply sent to: " + contact.getEmail());
        } catch (Exception e) {
            System.err.println(" Failed to send auto-reply: " + e.getMessage());
        }
    }
}