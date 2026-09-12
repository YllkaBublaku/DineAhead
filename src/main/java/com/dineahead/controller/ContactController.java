package com.dineahead.controller;

import com.dineahead.application.ContactService;
import com.dineahead.domain.Contact;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<Contact> submitContact(@RequestBody Contact contact) {
        Contact saved = contactService.saveContact(contact);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Contact>> getUnreadContacts() {
        return ResponseEntity.ok(contactService.getAllUnreadContacts());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Contact> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(contactService.markAsRead(id));
    }
}