package com.dineahead.domain;

import lombok.Data;

@Data
public class UserUpdateDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String avatarUrl;
}