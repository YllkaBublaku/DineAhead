package com.dineahead.application;

import com.dineahead.domain.AvailabilityDTO;
import com.dineahead.domain.Restaurant;
import com.dineahead.domain.RestaurantHours;
import com.dineahead.domain.RestaurantOverride;
import com.dineahead.domain.RestaurantTable;
import com.dineahead.domain.Reservation;
import com.dineahead.infrastructure.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AvailabilityService {

    private final RestaurantRepository restaurantRepository;
    private final RestaurantHoursRepository hoursRepository;
    private final RestaurantOverrideRepository overrideRepository;
    private final RestaurantTableRepository tableRepository;
    private final ReservationRepository reservationRepository;

    public AvailabilityService(RestaurantRepository restaurantRepository,
                               RestaurantHoursRepository hoursRepository,
                               RestaurantOverrideRepository overrideRepository,
                               RestaurantTableRepository tableRepository,
                               ReservationRepository reservationRepository) {
        this.restaurantRepository = restaurantRepository;
        this.hoursRepository = hoursRepository;
        this.overrideRepository = overrideRepository;
        this.tableRepository = tableRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public AvailabilityDTO getAvailability(Long restaurantId, LocalDate date, int partySize) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found: " + restaurantId));

        AvailabilityDTO dto = new AvailabilityDTO();
        dto.setRestaurantId(restaurantId);
        dto.setDate(date.toString());
        dto.setPartySize(partySize);

        LocalTime open = null;
        LocalTime close = null;
        boolean isClosed = false;

        List<RestaurantOverride> overrides = overrideRepository.findByRestaurantIdAndOverrideDate(restaurantId, date);
        if (overrides != null && !overrides.isEmpty()) {
            RestaurantOverride ov = overrides.get(0);
            isClosed = ov.isClosed();
            open = ov.getOpeningTime();
            close = ov.getClosingTime();
        } else {
            int dow = date.getDayOfWeek().getValue();
            List<RestaurantHours> hours = hoursRepository.findByRestaurantIdAndDayOfWeek(restaurantId, dow);
            if (hours == null || hours.isEmpty()) {
                isClosed = true;
            } else {
                RestaurantHours h = hours.get(0);
                isClosed = h.isClosed();
                open = h.getOpeningTime();
                close = h.getClosingTime();
            }
        }

        if (isClosed || open == null || close == null) {
            dto.setOpen(false);
            dto.setReason("Closed");
            dto.setSlots(new ArrayList<>());
            dto.setDetailedSlots(new ArrayList<>());
            return dto;
        }

        List<RestaurantTable> tables = tableRepository.findByRestaurantId(restaurantId);
        List<RestaurantTable> fittingTables = tables.stream()
                .filter(t -> t.getMinCapacity() != null && t.getMaxCapacity() != null)
                .filter(t -> t.getMinCapacity() <= partySize && partySize <= t.getMaxCapacity())
                .collect(Collectors.toList());

        if (fittingTables.isEmpty()) {
            dto.setOpen(true);
            dto.setReason("No table fits " + partySize + " guests");
            dto.setSlots(new ArrayList<>());
            dto.setDetailedSlots(new ArrayList<>());
            return dto;
        }

        int fittingTableCount = fittingTables.size();

        List<Reservation> existing = reservationRepository.findByRestaurantIdAndReservationDate(restaurantId, date);

        Map<LocalTime, Long> bookedPerTime = existing.stream()
                .filter(r -> r.getStatus() != null && !r.getStatus().name().equals("CANCELLED"))
                .filter(r -> r.getReservationTime() != null)
                .collect(Collectors.groupingBy(Reservation::getReservationTime, Collectors.counting()));

        List<LocalTime> allTimes = new ArrayList<>();
        LocalTime cur = open;
        while (cur.isBefore(close)) {
            allTimes.add(cur);
            cur = cur.plusMinutes(30);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime nowTime = now.toLocalTime();

        List<AvailabilityDTO.SlotInfo> detailed = new ArrayList<>();
        List<String> available = new ArrayList<>();

        for (LocalTime t : allTimes) {
            if (date.equals(today) && t.isBefore(nowTime.plusMinutes(30))) {
                continue;
            }

            long booked = bookedPerTime.getOrDefault(t, 0L);
            boolean ok = booked < fittingTableCount;

            AvailabilityDTO.SlotInfo info = new AvailabilityDTO.SlotInfo();
            info.setTime(String.format("%02d:%02d", t.getHour(), t.getMinute()));
            info.setAvailable(ok);
            info.setReason(ok ? null : "Fully booked");
            detailed.add(info);

            if (ok) {
                available.add(info.getTime());
            }
        }

        dto.setOpen(true);
        dto.setSlots(available);
        dto.setDetailedSlots(detailed);
        return dto;
    }

    @Transactional(readOnly = true)
    public Map<Long, AvailabilityDTO> getBatchAvailability(List<Long> restaurantIds, LocalDate date, int partySize) {
        Map<Long, AvailabilityDTO> result = new LinkedHashMap<>();
        for (Long id : restaurantIds) {
            result.put(id, getAvailability(id, date, partySize));
        }
        return result;
    }
}