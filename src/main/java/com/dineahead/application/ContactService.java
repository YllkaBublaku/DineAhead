package com.dineahead.application;

import com.dineahead.domain.Contact;
import com.dineahead.infrastructure.ContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContactService {

    private final ContactRepository contactRepository;
    private final EmailService emailService;

    public ContactService(ContactRepository contactRepository, EmailService emailService) {
        this.contactRepository = contactRepository;
        this.emailService = emailService;
    }

    @Transactional
    public Contact saveContact(Contact contact) {
        contact.setIsRead(false);
        Contact savedContact = contactRepository.save(contact);

        emailService.sendContactEmails(savedContact);

        return savedContact;
    }

    @Transactional(readOnly = true)
    public List<Contact> getAllUnreadContacts() {
        return contactRepository.findByIsReadFalseOrderByCreatedAtDesc();
    }

    @Transactional
    public Contact markAsRead(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        contact.setIsRead(true);
        return contactRepository.save(contact);
    }
}